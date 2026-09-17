import { FollowService } from '../services/follow.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class FollowController {
  static follow = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const result = await FollowService.follow(req.user!.userId, req.params.username!);
    res.status(201).json({ status: result.status });
  });

  static unfollow = asyncHandler(async (req: AuthenticatedRequest, res) => {
    await FollowService.unfollow(req.user!.userId, req.params.username!);
    res.status(204).send();
  });

  static respond = asyncHandler(async (req: AuthenticatedRequest, res) => {
    await FollowService.respondToRequest(req.user!.userId, req.params.username!, req.body.accept === true);
    res.json({ message: 'تم تحديث طلب المتابعة.' });
  });

  static followers = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const list = await FollowService.listFollowers(req.params.username!, req.user?.userId);
    res.json({ followers: list.map((f) => f.follower) });
  });

  static following = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const list = await FollowService.listFollowing(req.params.username!, req.user?.userId);
    res.json({ following: list.map((f) => f.following) });
  });
}
