import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { logger } from '../lib/logger.js';
import { isProduction } from '../config/env.js';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: 'المسار المطلوب غير موجود.', path: req.originalUrl });
}

/**
 * Single place all errors funnel through. Known/operational errors (AppError,
 * Zod validation) are reported to the client with their real message; any
 * other error is logged with full detail server-side but the client only
 * ever sees a generic message, so stack traces, SQL fragments, or internal
 * paths never leak.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: 'بيانات غير صالحة.',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err }, 'Operational 5xx error');
    }
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }

  logger.error({ err, path: req.originalUrl, method: req.method }, 'Unhandled error');

  return res.status(500).json({
    error: 'حدث خطأ غير متوقع في الخادم. تم إبلاغ الفريق التقني.',
    ...(isProduction ? {} : { debug: err instanceof Error ? err.message : String(err) }),
  });
}
