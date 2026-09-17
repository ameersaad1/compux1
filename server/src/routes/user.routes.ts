import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, attachUserIfPresent } from '../middleware/auth.middleware.js';
import { updateProfileSchema, requestVerificationSchema } from '../utils/validators/common.validators.js';

export const userRouter = Router();

userRouter.get('/search', requireAuth, UserController.search);
userRouter.get('/:username', attachUserIfPresent, UserController.getProfile);
userRouter.patch('/me', requireAuth, validate(updateProfileSchema), UserController.updateProfile);
userRouter.post('/me/request-verification', requireAuth, validate(requestVerificationSchema), UserController.requestVerification);
