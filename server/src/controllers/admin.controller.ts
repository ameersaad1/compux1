import { AdminService } from '../services/admin.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class AdminController {
  static stats = asyncHandler(async (_req, res) => {
    res.json(await AdminService.getStats());
  });

  static listUsers = asyncHandler(async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q : undefined;
    const page = Number(req.query.page ?? 1);
    res.json(await AdminService.listUsers(query, page));
  });

  static setBanned = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await AdminService.setBanned(req.params.userId!, req.body.banned, req.user!.userId);
    res.json({ user });
  });

  static setRole = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await AdminService.setRole(req.params.userId!, req.body.role, req.user!.userId);
    res.json({ user });
  });

  static verificationRequests = asyncHandler(async (_req, res) => {
    res.json({ requests: await AdminService.listVerificationRequests() });
  });

  static decideVerification = asyncHandler(async (req, res) => {
    const badge = await AdminService.decideVerification(req.params.badgeId!, req.body.approve, req.body.rejectionReason);
    res.json({ badge });
  });

  static deletePost = asyncHandler(async (req, res) => {
    await AdminService.deletePost(req.params.postId!);
    res.status(204).send();
  });

  static listPosts = asyncHandler(async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q : undefined;
    const page = Number(req.query.page ?? 1);
    res.json(await AdminService.listPosts(query, page));
  });
}
