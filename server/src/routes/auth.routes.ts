import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimit.middleware.js';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  googleAuthSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../utils/validators/auth.validators.js';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate(registerSchema), AuthController.register);
authRouter.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), AuthController.verifyOtp);
authRouter.post('/resend-otp', otpLimiter, validate(resendOtpSchema), AuthController.resendOtp);
authRouter.post('/login', authLimiter, validate(loginSchema), AuthController.login);
authRouter.post('/google', authLimiter, validate(googleAuthSchema), AuthController.googleLogin);
authRouter.post('/forgot-password', otpLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
authRouter.post('/reset-password', authLimiter, validate(resetPasswordSchema), AuthController.resetPassword);
authRouter.post('/refresh', AuthController.refresh);
authRouter.post('/logout', AuthController.logout);
authRouter.post('/logout-all', requireAuth, AuthController.logoutAll);
authRouter.get('/me', requireAuth, AuthController.me);
authRouter.post('/change-password', requireAuth, validate(changePasswordSchema), AuthController.changePassword);
