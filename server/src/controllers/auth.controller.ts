import type { Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { UserService } from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { isProduction } from '../config/env.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const REFRESH_COOKIE = 'refreshToken';
const ACCESS_COOKIE = 'accessToken';

/** Cookies are httpOnly (unreadable by JS -> immune to XSS token theft),
 *  `sameSite: lax` (CSRF-resistant for top-level navigation), and `secure`
 *  in production (never sent over plain HTTP). */
function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: maxAgeMs,
    path: '/',
  };
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string, refreshExpiresAt: Date) {
  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(refreshExpiresAt.getTime() - Date.now()));
}

function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
}

export class AuthController {
  static register = asyncHandler(async (req, res) => {
    const user = await AuthService.register(req.body);
    res.status(201).json({
      message: 'تم إنشاء الحساب بنجاح. تحقق من بريدك الإلكتروني للحصول على رمز التفعيل.',
      userId: user.id,
      email: user.email,
    });
  });

  static verifyOtp = asyncHandler(async (req, res) => {
    const { userId, code } = req.body;
    await AuthService.verifyOtp(userId, code);
    res.json({ message: 'تم التحقق من بريدك الإلكتروني بنجاح. يمكنك تسجيل الدخول الآن.' });
  });

  static resendOtp = asyncHandler(async (req, res) => {
    await AuthService.resendOtp(req.body.email);
    // Always return success, whether or not that email exists, to avoid
    // leaking which addresses are registered.
    res.json({ message: 'إذا كان البريد الإلكتروني مسجلاً، فسيتم إرسال رمز جديد إليه.' });
  });

  static login = asyncHandler(async (req, res) => {
    const device = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
    const { userId, role, requiresVerification } = await AuthService.login(req.body, device);

    if (requiresVerification) {
      return res.status(403).json({
        error: 'يرجى تفعيل بريدك الإلكتروني أولاً.',
        code: 'EMAIL_NOT_VERIFIED',
        userId,
      });
    }

    const tokens = await AuthService.issueTokens(userId, role, device);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, tokens.refreshExpiresAt);
    const me = await UserService.getMe(userId);
    res.json({ user: me });
  });

  static googleLogin = asyncHandler(async (req, res) => {
    const device = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
    const { userId, role } = await AuthService.loginWithGoogle(req.body.idToken);
    const tokens = await AuthService.issueTokens(userId, role, device);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, tokens.refreshExpiresAt);
    const me = await UserService.getMe(userId);
    res.json({ user: me });
  });

  static refresh = asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (!raw) throw AppError.unauthorized('لا توجد جلسة نشطة.');
    const tokens = await AuthService.rotateRefreshToken(raw);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, tokens.refreshExpiresAt);
    res.json({ message: 'تم تحديث الجلسة.' });
  });

  static logout = asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (raw) await AuthService.revokeRefreshToken(raw);
    clearAuthCookies(res);
    res.json({ message: 'تم تسجيل الخروج.' });
  });

  static logoutAll = asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) throw AppError.unauthorized();
    await AuthService.revokeAllSessions(req.user.userId);
    clearAuthCookies(res);
    res.json({ message: 'تم تسجيل الخروج من جميع الأجهزة.' });
  });

  static me = asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) throw AppError.unauthorized();
    const me = await UserService.getMe(req.user.userId);
    res.json({ user: me });
  });

  static changePassword = asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) throw AppError.unauthorized();
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(req.user.userId, currentPassword, newPassword);
    clearAuthCookies(res);
    res.json({ message: 'تم تغيير كلمة المرور. يرجى تسجيل الدخول مجدداً.' });
  });

  static forgotPassword = asyncHandler(async (req, res) => {
    await AuthService.requestPasswordReset(req.body.email);
    // Always return success, whether or not that email exists, to avoid
    // leaking which addresses are registered (same posture as resendOtp).
    res.json({ message: 'إذا كان البريد الإلكتروني مسجلاً، فسيصلك رابط لإعادة تعيين كلمة المرور.' });
  });

  static resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    await AuthService.resetPassword(token, newPassword);
    clearAuthCookies(res);
    res.json({ message: 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.' });
  });
}
