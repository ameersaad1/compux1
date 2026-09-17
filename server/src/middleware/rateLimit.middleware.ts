import rateLimit from 'express-rate-limit';

/** Generic API limit: generous, just to blunt scraping/abuse. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'عدد كبير من الطلبات، حاول بعد قليل.' },
});

/** Tight limit on login/register to slow down credential-stuffing & brute force. */
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'عدد كبير من محاولات الدخول، يرجى الانتظار 10 دقائق.' },
});

/** Very tight limit on OTP requests - each one costs an email/SMS send. */
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'تجاوزت الحد المسموح لطلب رمز التحقق. حاول بعد 10 دقائق.' },
});
