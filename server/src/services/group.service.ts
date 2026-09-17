import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';

export class GroupService {
  static async list(search?: string) {
    return prisma.group.findMany({
      where: search ? { name: { contains: search, mode: 'insensitive' } } : undefined,
      orderBy: { memberCount: 'desc' },
      take: 50,
    });
  }

  static async getById(groupId: string, viewerId?: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { _count: { select: { members: true, posts: true, events: true } } },
    });
    if (!group) throw AppError.notFound('المجموعة غير موجودة.');

    let membership = null;
    if (viewerId) {
      membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: viewerId } } });
    }

    // Private groups are discoverable (name/description/member count so
    // people know they exist and can request access) but their member
    // roster is not - that's checked separately in listMembers, which is
    // the endpoint that actually enumerates people.
    return { ...group, myRole: membership?.role ?? null };
  }

  /** Throws unless `userId` is a member of `groupId`. Shared by every endpoint that must not leak a private group's internals to outsiders. */
  static async assertMember(groupId: string, userId?: string): Promise<void> {
    if (!userId) throw AppError.unauthorized('يلزم تسجيل الدخول للوصول لهذا المورد.');
    const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
    if (!membership) throw AppError.forbidden('هذا المحتوى مقتصر على أعضاء المجموعة.');
  }

  static async create(creatorId: string, name: string, description: string, isPrivate: boolean) {
    return prisma.$transaction(async (tx) => {
      const group = await tx.group.create({ data: { name: name.trim(), description, isPrivate, creatorId } });
      await tx.groupMember.create({ data: { groupId: group.id, userId: creatorId, role: 'ADMIN' } });
      return group;
    });
  }

  static async join(groupId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const group = await tx.group.findUnique({ where: { id: groupId } });
      if (!group) throw AppError.notFound('المجموعة غير موجودة.');

      // Private groups are invite-only: a member with MODERATOR/ADMIN role
      // must add people explicitly (see `addMember`). Without this check,
      // "private" was only a UI label - the API would happily let anyone
      // self-join, which is exactly the kind of gap the API-is-the-trust-
      // boundary posture in SECURITY.md is meant to rule out.
      if (group.isPrivate) {
        throw AppError.forbidden('هذه مجموعة خاصة. يجب أن يضيفك أحد المشرفين للانضمام إليها.');
      }
      if (group.memberCount >= group.maxMembers) throw AppError.conflict('اكتمل عدد أعضاء هذه المجموعة.');

      const existing = await tx.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
      if (existing) throw AppError.conflict('أنت عضو في هذه المجموعة بالفعل.');

      await tx.groupMember.create({ data: { groupId, userId, role: 'MEMBER' } });
      return tx.group.update({ where: { id: groupId }, data: { memberCount: { increment: 1 } } });
    });
  }

  /** Lets a group MODERATOR/ADMIN add someone directly - the only way into a private group. */
  static async addMember(groupId: string, requesterId: string, targetUserId: string) {
    return prisma.$transaction(async (tx) => {
      const requesterMembership = await tx.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: requesterId } },
      });
      if (!requesterMembership || !['MODERATOR', 'ADMIN'].includes(requesterMembership.role)) {
        throw AppError.forbidden('يجب أن تكون مشرفاً على المجموعة لإضافة أعضاء.');
      }

      const group = await tx.group.findUnique({ where: { id: groupId } });
      if (!group) throw AppError.notFound('المجموعة غير موجودة.');
      if (group.memberCount >= group.maxMembers) throw AppError.conflict('اكتمل عدد أعضاء هذه المجموعة.');

      const targetUser = await tx.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
      if (!targetUser) throw AppError.notFound('المستخدم غير موجود.');

      const existing = await tx.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: targetUserId } } });
      if (existing) throw AppError.conflict('هذا المستخدم عضو في المجموعة بالفعل.');

      await tx.groupMember.create({ data: { groupId, userId: targetUserId, role: 'MEMBER' } });
      return tx.group.update({ where: { id: groupId }, data: { memberCount: { increment: 1 } } });
    });
  }

  static async leave(groupId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const membership = await tx.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
      if (!membership) throw AppError.notFound('لست عضواً في هذه المجموعة.');
      if (membership.role === 'ADMIN') {
        const adminCount = await tx.groupMember.count({ where: { groupId, role: 'ADMIN' } });
        if (adminCount <= 1) throw AppError.badRequest('لا يمكنك مغادرة المجموعة وأنت المشرف الوحيد. عيّن مشرفاً آخر أولاً.');
      }
      await tx.groupMember.delete({ where: { id: membership.id } });
      await tx.group.update({ where: { id: groupId }, data: { memberCount: { decrement: 1 } } });
    });
  }

  static async listMembers(groupId: string, viewerId?: string) {
    const group = await prisma.group.findUnique({ where: { id: groupId }, select: { isPrivate: true } });
    if (!group) throw AppError.notFound('المجموعة غير موجودة.');
    if (group.isPrivate) await GroupService.assertMember(groupId, viewerId);

    return prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, username: true, fullName: true, avatarUrl: true, isVerified: true } } },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });
  }
}
