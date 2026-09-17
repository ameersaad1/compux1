import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { setBannedSchema, setRoleSchema, decideVerificationSchema } from '../utils/validators/admin.validators.js';

export const adminRouter = Router();

// Every route below requires a valid session AND the ADMIN role.
adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.get('/stats', AdminController.stats);
adminRouter.get('/users', AdminController.listUsers);
adminRouter.patch('/users/:userId/ban', validate(setBannedSchema), AdminController.setBanned);
adminRouter.patch('/users/:userId/role', validate(setRoleSchema), AdminController.setRole);
adminRouter.get('/verification-requests', AdminController.verificationRequests);
adminRouter.patch('/verification-requests/:badgeId', validate(decideVerificationSchema), AdminController.decideVerification);
adminRouter.delete('/posts/:postId', AdminController.deletePost);
adminRouter.get('/posts', AdminController.listPosts);
