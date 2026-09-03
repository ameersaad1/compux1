import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const RegisterSchema = z.object({
  email: z.string().email({ message: 'يرجى إدخال بريد إلكتروني صحيح' }),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
  fullName: z.string().min(2).max(100),
  universityName: z.string().min(2),
  graduationYear: z.number().int().min(2020).max(2035),
});

export const VerifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export class AuthController {
  static async authenticateWithGoogle(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({ error: 'رمز idToken الخاص بجوجل مطلوب.' });
      }

      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(401).json({ error: 'تعذر التحقق من بيانات حساب جوجل.' });
      }

      const { email, name, picture, email_verified } = payload;

      if (!email_verified) {
        return res.status(403).json({ error: 'بريد جوجل هذا غير مفعل.' });
      }

      const isEduEmail = email.endsWith('.edu') || email.includes('.edu.');

      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const username = `${baseUsername}_${randomSuffix}`;

        const domain = email.split('@')[1];
        const universityName = isEduEmail ? domain.split('.')[0].toUpperCase() : 'غير محدد';

        user = await prisma.user.create({
          data: {
            email,
            username,
            fullName: name || 'مستخدم جديد',
            passwordHash: '',
            avatarUrl: picture,
            universityName,
            graduationYear: new Date().getFullYear() + 4,
            isVerified: isEduEmail,
            verificationBadge: {
              create: {
                status: isEduEmail ? 'APPROVED' : 'UNVERIFIED',
                verifiedAt: isEduEmail ? new Date() : null,
                ssoId: payload.sub,
              },
            },
          },
        });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '7d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        message: 'تم تسجيل الدخول بنجاح بواسطة حساب Google.',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          isVerified: user.isVerified,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  static async requestEmailOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'البريد الإلكتروني مطلوب.' });
      }

      const rateLimitKey = `otp_ratelimit:${email}`;
      const attempts = await redis.incr(rateLimitKey);

      if (attempts === 1) {
        await redis.expire(rateLimitKey, 600);
      }

      if (attempts > 3) {
        return res.status(429).json({
          error: 'تجاوزت الحد المسموح من المحاولات. يرجى الانتظار 10 دقائق.',
        });
      }

      const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
      const otpKey = `otp_code:${email}`;

      await redis.set(otpKey, generatedOTP, 'EX', 300);

      return res.status(200).json({
        message: 'تم إرسال رمز التحقق بنجاح إلى بريدك الإلكتروني.',
      });
    } catch (error) {
      return next(error);
    }
  }

  static async registerUser(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = RegisterSchema.parse(req.body);

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: validatedData.email }, { username: validatedData.username }],
        },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل.' });
      }

      const passwordHash = await bcrypt.hash(validatedData.password, 12);

      const newUser = await prisma.user.create({
        data: {
          ...validatedData,
          passwordHash,
          verificationBadge: {
            create: {
              status: 'UNVERIFIED',
            },
          },
        },
      });

      const token = jwt.sign(
        { userId: newUser.id, role: newUser.role },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '7d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        message: 'تم إنشاء الحساب بنجاح.',
        user: { id: newUser.id, username: newUser.username, email: newUser.email },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: string };
}

export async function authorizePrivateProfileAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const currentUserId = req.user?.userId;
    const targetUserId = req.params.targetUserId || req.body.targetUserId;

    if (!targetUserId) {
      return res.status(400).json({ error: 'معرف المستخدم المطلوب غير موجود.' });
    }

    if (currentUserId === targetUserId) {
      return next();
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { isPrivate: true },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود.' });
    }

    if (targetUser.isPrivate) {
      if (!currentUserId) {
        return res.status(401).json({ error: 'يلزم تسجيل الدخول لعرض هذا المحتوى.' });
      }

      const isFollowing = await prisma.follower.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
      });

      if (!isFollowing || isFollowing.status !== 'ACCEPTED') {
        return res.status(403).json({
          error: 'هذا الحساب خاص. يجب متابعته أولاً لرؤية المحتوى.',
        });
      }
    }

    return next();
  } catch (error) {
    return next(error);
  }
}
