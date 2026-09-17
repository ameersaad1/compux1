import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const notificationRouter = Router();

notificationRouter.get('/', requireAuth, NotificationController.list);
notificationRouter.post('/read-all', requireAuth, NotificationController.markAllRead);
