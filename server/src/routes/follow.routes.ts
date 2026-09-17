import { Router } from 'express';
import { FollowController } from '../controllers/follow.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, attachUserIfPresent } from '../middleware/auth.middleware.js';
import { respondFollowSchema } from '../utils/validators/common.validators.js';

export const followRouter = Router();

followRouter.get('/:username/followers', attachUserIfPresent, FollowController.followers);
followRouter.get('/:username/following', attachUserIfPresent, FollowController.following);
followRouter.post('/:username', requireAuth, FollowController.follow);
followRouter.delete('/:username', requireAuth, FollowController.unfollow);
followRouter.post('/:username/respond', requireAuth, validate(respondFollowSchema), FollowController.respond);
