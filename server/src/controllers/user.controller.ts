import { UserService } from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class UserController {
  static getProfile = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const profile = await UserService.getPublicProfile(req.params.username!, req.user?.userId);
    res.json({ profile });
  });

  static updateProfile = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const updated = await UserService.updateProfile(req.user!.userId, req.body);
    res.json({ profile: updated });
  });

  static search = asyncHandler(async (req, res) => {
    const results = await UserService.searchUsers(String(req.query.q ?? ''));
    res.json({ results });
  });

  static requestVerification = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const badge = await UserService.requestVerification(req.user!.userId, req.body.studentIdCardUrl);
    res.status(201).json({ badge });
  });
}
