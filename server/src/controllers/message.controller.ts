import { MessageService } from '../services/message.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class MessageController {
  static conversations = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const conversations = await MessageService.listConversations(req.user!.userId);
    res.json({ conversations });
  });

  static history = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const result = await MessageService.getHistory(req.user!.userId, req.params.username!);
    res.json(result);
  });
}
