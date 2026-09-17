import { GroupService } from '../services/group.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class GroupController {
  static list = asyncHandler(async (req, res) => {
    const search = typeof req.query.q === 'string' ? req.query.q : undefined;
    res.json({ groups: await GroupService.list(search) });
  });

  static getOne = asyncHandler(async (req: AuthenticatedRequest, res) => {
    res.json({ group: await GroupService.getById(req.params.groupId!, req.user?.userId) });
  });

  static create = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { name, description, isPrivate } = req.body;
    const group = await GroupService.create(req.user!.userId, name, description ?? '', Boolean(isPrivate));
    res.status(201).json({ group });
  });

  static join = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const group = await GroupService.join(req.params.groupId!, req.user!.userId);
    res.status(201).json({ group });
  });

  static leave = asyncHandler(async (req: AuthenticatedRequest, res) => {
    await GroupService.leave(req.params.groupId!, req.user!.userId);
    res.status(204).send();
  });

  static members = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const members = await GroupService.listMembers(req.params.groupId!, req.user?.userId);
    res.json({ members });
  });

  static addMember = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const group = await GroupService.addMember(req.params.groupId!, req.user!.userId, req.params.userId!);
    res.status(201).json({ group });
  });
}
