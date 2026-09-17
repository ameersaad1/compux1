import type { NextFunction, Request, Response } from 'express';
import { TokenService } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { prisma } from '../lib/prisma.js';

export interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: string };
}

function extractAccessToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies?.accessToken) return req.cookies.accessToken as string;
  return null;
}

/** Rejects the request unless a valid, non-expired access token is present. */
export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const token = extractAccessToken(req);
    if (!token) throw AppError.unauthorized('يلزم تسجيل الدخول للوصول لهذا المورد.');

    const payload = TokenService.verifyAccessToken(token);
    req.user = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    next(AppError.unauthorized('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً.'));
  }
}

/** Attaches `req.user` when a token is present, but never blocks the request. */
export function attachUserIfPresent(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const token = extractAccessToken(req);
    if (token) {
      const payload = TokenService.verifyAccessToken(token);
      req.user = { userId: payload.sub, role: payload.role };
    }
  } catch {
    // Invalid/expired token on an optional-auth route: just proceed as a guest.
  }
  next();
}

/** Role-based guard, e.g. `requireRole('ADMIN', 'MODERATOR')`. */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden('هذا الإجراء يتطلب صلاحيات أعلى.'));
    }
    next();
  };
}

/** Blocks banned accounts even if their access token is still technically valid. */
export async function rejectBannedUsers(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    if (!req.user) return next();
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isBanned: true, lockedUntil: true },
    });
    if (!user) return next(AppError.unauthorized('الحساب غير موجود.'));
    if (user.isBanned) return next(AppError.forbidden('تم حظر هذا الحساب.'));
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return next(AppError.forbidden('الحساب موقوف مؤقتاً، حاول لاحقاً.'));
    }
    next();
  } catch (err) {
    next(err);
  }
}
