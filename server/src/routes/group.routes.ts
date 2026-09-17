import { Router } from 'express';
import { GroupController } from '../controllers/group.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, attachUserIfPresent } from '../middleware/auth.middleware.js';
import { createGroupSchema } from '../utils/validators/common.validators.js';

export const groupRouter = Router();

groupRouter.get('/', GroupController.list);
groupRouter.get('/:groupId', attachUserIfPresent, GroupController.getOne);
groupRouter.get('/:groupId/members', attachUserIfPresent, GroupController.members);
groupRouter.post('/', requireAuth, validate(createGroupSchema), GroupController.create);
groupRouter.post('/:groupId/join', requireAuth, GroupController.join);
groupRouter.post('/:groupId/leave', requireAuth, GroupController.leave);
// Admin/moderator-only: the sole way into a private group (see GroupService.join).
groupRouter.post('/:groupId/members/:userId', requireAuth, GroupController.addMember);
