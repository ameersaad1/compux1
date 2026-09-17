import { Router } from 'express';
import { PostController } from '../controllers/post.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, attachUserIfPresent } from '../middleware/auth.middleware.js';
import { createPostSchema, addCommentSchema } from '../utils/validators/common.validators.js';

export const postRouter = Router();

postRouter.get('/feed', requireAuth, PostController.feed);
postRouter.get('/user/:username', attachUserIfPresent, PostController.byUser);
postRouter.get('/group/:groupId', attachUserIfPresent, PostController.byGroup);
postRouter.post('/', requireAuth, validate(createPostSchema), PostController.create);
postRouter.delete('/:postId', requireAuth, PostController.remove);
postRouter.post('/:postId/like', requireAuth, PostController.toggleLike);
postRouter.get('/:postId/comments', PostController.listComments);
postRouter.post('/:postId/comments', requireAuth, validate(addCommentSchema), PostController.addComment);
