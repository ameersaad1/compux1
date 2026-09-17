import { NotificationService } from '../services/notification.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class NotificationController {
  static list = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const [notifications, unreadCount] = await Promise.all([
      NotificationService.listForUser(req.user!.userId),
      NotificationService.unreadCount(req.user!.userId),
    ]);
    res.json({ notifications, unreadCount });
  });

  static markAllRead = asyncHandler(async (req: AuthenticatedRequest, res) => {
    await NotificationService.markAllRead(req.user!.userId);
    res.json({ message: 'تم تحديد كل الإشعارات كمقروءة.' });
  });
}
