import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { NotificationService } from './notification.service.js';

export class FollowService {
  static async follow(followerId: string, targetUsername: string) {
    const target = await prisma.user.findUnique({ where: { username: targetUsername.toLowerCase() } });
    if (!target) throw AppError.notFound('المستخدم غير موجود.');
    if (target.id === followerId) throw AppError.badRequest('لا يمكنك متابعة نفسك.');

    const existing = await prisma.follower.findUnique({
      where: { followerId_followingId: { followerId, followingId: target.id } },
    });
    if (existing) throw AppError.conflict('أنت تتابع هذا المستخدم بالفعل.');

    const status = target.isPrivate ? 'PENDING' : 'ACCEPTED';
    const follow = await prisma.follower.create({
      data: { followerId, followingId: target.id, status },
    });

    await NotificationService.create({
      recipientId: target.id,
      actorId: followerId,
      type: status === 'PENDING' ? 'FOLLOW_REQUEST' : 'FOLLOW_ACCEPT',
    });

    return follow;
  }

  static async unfollow(followerId: string, targetUsername: string) {
    const target = await prisma.user.findUnique({ where: { username: targetUsername.toLowerCase() } });
    if (!target) throw AppError.notFound('المستخدم غير موجود.');
    await prisma.follower.deleteMany({ where: { followerId, followingId: target.id } });
  }

  static async respondToRequest(userId: string, requesterUsername: string, accept: boolean) {
    const requester = await prisma.user.findUnique({ where: { username: requesterUsername.toLowerCase() } });
    if (!requester) throw AppError.notFound('المستخدم غير موجود.');

    const relation = await prisma.follower.findUnique({
      where: { followerId_followingId: { followerId: requester.id, followingId: userId } },
    });
    if (!relation || relation.status !== 'PENDING') throw AppError.notFound('لا يوجد طلب متابعة معلّق من هذا المستخدم.');

    if (accept) {
      await prisma.follower.update({ where: { id: relation.id }, data: { status: 'ACCEPTED' } });
      await NotificationService.create({ recipientId: requester.id, actorId: userId, type: 'FOLLOW_ACCEPT' });
    } else {
      await prisma.follower.delete({ where: { id: relation.id } });
    }
  }

  /** Anyone can see the follow relationship exists (via the count on the profile), but the actual roster of who follows a private account is only for the account owner and its accepted followers - same posture as a private group's member list. */
  static async assertCanViewList(target: { id: string; isPrivate: boolean }, viewerId?: string) {
    if (!target.isPrivate || viewerId === target.id) return;
    const isAcceptedFollower = viewerId
      ? await prisma.follower.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: target.id } },
        })
      : null;
    if (!isAcceptedFollower || isAcceptedFollower.status !== 'ACCEPTED') {
      throw AppError.forbidden('هذا الحساب خاص. تابعه لرؤية قائمة المتابعين.');
    }
  }

  static async listFollowers(username: string, viewerId?: string) {
    const user = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
    if (!user) throw AppError.notFound('المستخدم غير موجود.');
    await FollowService.assertCanViewList(user, viewerId);
    return prisma.follower.findMany({
      where: { followingId: user.id, status: 'ACCEPTED' },
      include: { follower: { select: { id: true, username: true, fullName: true, avatarUrl: true, isVerified: true } } },
    });
  }

  static async listFollowing(username: string, viewerId?: string) {
    const user = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
    if (!user) throw AppError.notFound('المستخدم غير موجود.');
    await FollowService.assertCanViewList(user, viewerId);
    return prisma.follower.findMany({
      where: { followerId: user.id, status: 'ACCEPTED' },
      include: { following: { select: { id: true, username: true, fullName: true, avatarUrl: true, isVerified: true } } },
    });
  }
}
