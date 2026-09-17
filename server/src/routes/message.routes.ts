import { Router } from 'express';
import { MessageController } from '../controllers/message.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const messageRouter = Router();

messageRouter.get('/conversations', requireAuth, MessageController.conversations);
messageRouter.get('/:username', requireAuth, MessageController.history);
