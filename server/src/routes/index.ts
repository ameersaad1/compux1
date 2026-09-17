import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { adminRouter } from './admin.routes.js';
import { userRouter } from './user.routes.js';
import { postRouter } from './post.routes.js';
import { followRouter } from './follow.routes.js';
import { uploadRouter } from './upload.routes.js';
import { eventRouter } from './event.routes.js';
import { groupRouter } from './group.routes.js';
import { messageRouter } from './message.routes.js';
import { notificationRouter } from './notification.routes.js';
import { rejectBannedUsers, attachUserIfPresent } from '../middleware/auth.middleware.js';

export const apiRouter = Router();

// Every request gets a best-effort identity attached (guest or user), then
// any authenticated-but-banned/locked account is rejected before it reaches
// business logic.
apiRouter.use(attachUserIfPresent, rejectBannedUsers);

apiRouter.use('/auth', authRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/posts', postRouter);
apiRouter.use('/follow', followRouter);
apiRouter.use('/uploads', uploadRouter);
apiRouter.use('/events', eventRouter);
apiRouter.use('/groups', groupRouter);
apiRouter.use('/messages', messageRouter);
apiRouter.use('/notifications', notificationRouter);
