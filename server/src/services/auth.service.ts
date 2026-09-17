import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { AppError } from '../utils/AppError.js';
import { TokenService } from '../utils/jwt.js';
import { EmailService } from './email.service.js';
import { env, eduSuffixes } from '../config/env.js';

const BCRYPT_ROUNDS = 12;
const OTP_TTL_SECONDS = 5 * 60;
const MAX_FAILED_LOGINS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export interface RegisterInput {
  email: string;
  username: string;
  fullName: string;
  password: string;
  universityName: string;
  graduationYear: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface DeviceMeta {
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

/**
 * All authentication business logic lives here, independent of Express.
 * Controllers stay thin (parse request -> call service -> shape response),
 * which keeps this logic unit-testable and reusable (e.g. from a CLI or a
 * background job) without spinning up an HTTP server.
 */
export class AuthService {
  // ── Registration ────────────────────────────────────────────────────
  static async register(input: RegisterInput) {
    const email = input.email.toLowerCase().trim();
    const username = input.username.toLowerCase().trim();

    const isEduEmail = eduSuffixes.some((suffix) => email.endsWith(suffix));
    if (!isEduEmail) {
      throw AppError.badRequest('يجب استخدام بريد إلكتروني جامعي رسمي للتسجيل.', 'NON_EDU_EMAIL');
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { email: true, username: true },
    });
    if (existing) {
      if (existing.email === email) throw AppError.conflict('يوجد حساب مسجل بهذا البريد الإلكتروني مسبقاً.');
      throw AppError.conflict('اسم المستخدم هذا محجوز، جرّب اسماً آخر.');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        fullName: input.fullName.trim(),
        passwordHash,
        universityName: input.universityName.trim(),
        graduationYear: input.graduationYear,
      },
      select: { id: true, email: true, username: true, fullName: true, role: true },
    });

    await AuthService.issueAndSendOtp(user.id, user.email);

    return user;
  }

  // ── Email OTP verification ──────────────────────────────────────────
  private static otpKey(userId: string) {
    return `otp:${userId}`;
  }
  private static otpAttemptsKey(userId: string) {
    return `otp:attempts:${userId}`;
  }

  static async issueAndSendOtp(userId: string, email: string): Promise<void> {
    const otp = crypto.randomInt(100000, 999999).toString();
    await redis.set(AuthService.otpKey(userId), otp, 'EX', OTP_TTL_SECONDS);
    await redis.del(AuthService.otpAttemptsKey(userId));
    await EmailService.sendOtpEmail(email, otp);
  }

  static async resendOtp(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return; // Do not reveal whether an email is registered.
    if (user.emailVerifiedAt) return;
    await AuthService.issueAndSendOtp(user.id, user.email);
  }

  static async verifyOtp(userId: string, code: string): Promise<void> {
    const attemptsKey = AuthService.otpAttemptsKey(userId);
    const attempts = Number((await redis.get(attemptsKey)) ?? 0);
    if (attempts >= 5) {
      throw AppError.tooManyRequests('عدد محاولات كبير، اطلب رمزاً جديداً.');
    }

    const stored = await redis.get(AuthService.otpKey(userId));
    if (!stored) throw AppError.badRequest('انتهت صلاحية الرمز، اطلب رمزاً جديداً.', 'OTP_EXPIRED');

    // Constant-time comparison so response timing can't leak the correct code.
    const match =
      stored.length === code.length &&
      crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(code));

    if (!match) {
      await redis.multi().incr(attemptsKey).expire(attemptsKey, OTP_TTL_SECONDS).exec();
      throw AppError.badRequest('رمز التحقق غير صحيح.', 'OTP_INVALID');
    }

    await redis.del(AuthService.otpKey(userId));
    await redis.del(attemptsKey);
    await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  }

  // ── Login ────────────────────────────────────────────────────────────
  static async login(input: LoginInput, device: DeviceMeta): Promise<{ userId: string; role: string; requiresVerification: boolean }> {
    const email = input.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });

    // Same generic error whether the email doesn't exist or the password is
    // wrong - prevents attackers from enumerating registered accounts.
    const genericError = () => AppError.unauthorized('البريد الإلكتروني أو كلمة المرور غير صحيحة.');

    if (!user) throw genericError();

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw AppError.forbidden('الحساب موقوف مؤقتاً بسبب محاولات دخول فاشلة متكررة. حاول لاحقاً.');
    }
    if (user.isBanned) throw AppError.forbidden('تم حظر هذا الحساب.');

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      const failedCount = user.failedLoginCount + 1;
      const shouldLock = failedCount >= MAX_FAILED_LOGINS;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: shouldLock ? 0 : failedCount,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : null,
        },
      });
      throw genericError();
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    void device; // reserved for device/session auditing (see issueTokens)

    return { userId: user.id, role: user.role, requiresVerification: !user.emailVerifiedAt };
  }

  // ── Google Sign-In ───────────────────────────────────────────────────
  static async loginWithGoogle(idToken: string) {
    if (!googleClient || !env.GOOGLE_CLIENT_ID) {
      throw AppError.badRequest('تسجيل الدخول عبر جوجل غير مُفعّل على الخادم.');
    }

    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email) throw AppError.unauthorized('تعذر التحقق من حساب جوجل.');

    const email = payload.email.toLowerCase();
    const isEduEmail = eduSuffixes.some((suffix) => email.endsWith(suffix));
    if (!isEduEmail) {
      throw AppError.badRequest('يجب استخدام بريد جامعي رسمي مرتبط بحساب جوجل.', 'NON_EDU_EMAIL');
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const baseUsername = email.split('@')[0]!.replace(/[^a-z0-9_]/gi, '').toLowerCase();
      let username = baseUsername;
      let suffix = 0;
      // Guarantee uniqueness without a retry loop against the DB race.
      while (await prisma.user.findUnique({ where: { username } })) {
        suffix += 1;
        username = `${baseUsername}${suffix}`;
      }

      user = await prisma.user.create({
        data: {
          email,
          username,
          fullName: payload.name ?? baseUsername,
          avatarUrl: payload.picture,
          // Google-authenticated accounts have no local password; lock the
          // hash to a value that can never match any bcrypt comparison.
          passwordHash: `google-oauth:${crypto.randomUUID()}`,
          universityName: 'غير محدد',
          graduationYear: new Date().getFullYear(),
          emailVerifiedAt: new Date(),
        },
      });
    }

    if (user.isBanned) throw AppError.forbidden('تم حظر هذا الحساب.');

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return { userId: user.id, role: user.role };
  }

  // ── Token issuance / refresh / revocation ──────────────────────────
  static async issueTokens(userId: string, role: string, device: DeviceMeta): Promise<AuthTokens> {
    const accessToken = TokenService.signAccessToken({ sub: userId, role });
    const { token: refreshToken, hash } = TokenService.generateRefreshToken();
    const refreshExpiresAt = TokenService.refreshTtlToDate();

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hash,
        expiresAt: refreshExpiresAt,
        userAgent: device.userAgent,
        ipAddress: device.ipAddress,
      },
    });

    return { accessToken, refreshToken, refreshExpiresAt };
  }

  /** Rotates a refresh token: the old one is revoked and a brand-new one issued. */
  static async rotateRefreshToken(rawToken: string): Promise<AuthTokens> {
    const hash = TokenService.hashRefreshToken(rawToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw AppError.unauthorized('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً.');
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || user.isBanned) throw AppError.unauthorized();

    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

    return AuthService.issueTokens(user.id, user.role, {
      userAgent: stored.userAgent ?? undefined,
      ipAddress: stored.ipAddress ?? undefined,
    });
  }

  static async revokeRefreshToken(rawToken: string): Promise<void> {
    const hash = TokenService.hashRefreshToken(rawToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** "Sign out of all devices". */
  static async revokeAllSessions(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ── Password management ─────────────────────────────────────────────
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('المستخدم غير موجود.');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw AppError.badRequest('كلمة المرور الحالية غير صحيحة.');

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await AuthService.revokeAllSessions(userId);
    await EmailService.sendPasswordChangedNotice(user.email);
  }

  // ── Forgot / reset password ─────────────────────────────────────────
  // The raw token is only ever sent to the user's inbox; the server only
  // ever stores/compares its SHA-256 hash (same posture as refresh tokens),
  // so a Redis dump or log line can't be replayed into a live reset.
  private static resetTokenKey(hash: string) {
    return `pwreset:${hash}`;
  }
  private static resetUserKey(userId: string) {
    return `pwreset:user:${userId}`;
  }
  private static hashResetToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return; // Do not reveal whether an email is registered.

    // A fresh request invalidates any reset link already in the user's inbox.
    const previousHash = await redis.get(AuthService.resetUserKey(user.id));
    if (previousHash) await redis.del(AuthService.resetTokenKey(previousHash));

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hash = AuthService.hashResetToken(rawToken);
    const ttlSeconds = 30 * 60;
    await redis.set(AuthService.resetTokenKey(hash), user.id, 'EX', ttlSeconds);
    await redis.set(AuthService.resetUserKey(user.id), hash, 'EX', ttlSeconds);

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;
    await EmailService.sendPasswordResetEmail(user.email, resetUrl);
  }

  static async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const hash = AuthService.hashResetToken(rawToken);
    const userId = await redis.get(AuthService.resetTokenKey(hash));
    if (!userId) throw AppError.badRequest('رابط إعادة التعيين غير صالح أو منتهي الصلاحية.', 'RESET_TOKEN_INVALID');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('المستخدم غير موجود.');

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash, failedLoginCount: 0, lockedUntil: null } });

    await redis.del(AuthService.resetTokenKey(hash));
    await redis.del(AuthService.resetUserKey(userId));
    await AuthService.revokeAllSessions(userId);
    await EmailService.sendPasswordChangedNotice(user.email);
  }
}
