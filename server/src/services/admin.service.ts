import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export class AdminService {
  static async getStats() {
    const [totalUsers, totalPosts, activeToday, pendingVerify] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.user.count({ where: { lastLoginAt: { gte: startOfToday() } } }),
      prisma.verificationBadge.count({ where: { status: 'PENDING' } }),
    ]);
    return { totalUsers, totalPosts, activeToday, pendingVerify };
  }

  static async listUsers(query: string | undefined, page: number, pageSize = 20) {
    const where = query
      ? { OR: [{ username: { contains: query, mode: 'insensitive' as const } }, { email: { contains: query, mode: 'insensitive' as const } }] }
      : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          avatarUrl: true,
          role: true,
          isBanned: true,
          isVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);
    return { users, total, page, pageSize };
  }

  static async setBanned(targetUserId: string, banned: boolean, requesterId: string) {
    if (targetUserId === requesterId) throw AppError.badRequest('لا يمكنك حظر حسابك الخاص.');
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw AppError.notFound('المستخدم غير موجود.');
    if (target.role === 'ADMIN') throw AppError.forbidden('لا يمكن حظر مشرف آخر.');
    return prisma.user.update({ where: { id: targetUserId }, data: { isBanned: banned } });
  }

  static async setRole(targetUserId: string, role: 'STUDENT' | 'MODERATOR' | 'ADMIN', requesterId: string) {
    if (targetUserId === requesterId) throw AppError.badRequest('لا يمكنك تعديل صلاحياتك الخاصة.');
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw AppError.notFound('المستخدم غير موجود.');
    return prisma.user.update({ where: { id: targetUserId }, data: { role } });
  }

  static async listVerificationRequests() {
    return prisma.verificationBadge.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { id: true, username: true, fullName: true, avatarUrl: true, universityName: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async decideVerification(badgeId: string, approve: boolean, rejectionReason?: string) {
    const badge = await prisma.verificationBadge.findUnique({ where: { id: badgeId } });
    if (!badge) throw AppError.notFound('طلب التحقق غير موجود.');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.verificationBadge.update({
        where: { id: badgeId },
        data: {
          status: approve ? 'APPROVED' : 'REJECTED',
          verifiedAt: approve ? new Date() : null,
          rejectionReason: approve ? null : rejectionReason,
        },
      });
      if (approve) {
        await tx.user.update({ where: { id: badge.userId }, data: { isVerified: true } });
      }
      return updated;
    });
  }

  static async deletePost(postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw AppError.notFound('المنشور غير موجود.');
    await prisma.post.delete({ where: { id: postId } });
  }

  /** Recent posts across the whole platform (including group posts), for the moderation queue. Not exposed to regular users - this bypasses the normal feed/privacy scoping on purpose, which is exactly why it's admin-only. */
  static async listPosts(query: string | undefined, page: number, pageSize = 20) {
    const where = query
      ? {
          OR: [
            { content: { contains: query, mode: 'insensitive' as const } },
            { author: { username: { contains: query, mode: 'insensitive' as const } } },
          ],
        }
      : {};
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        select: {
          id: true,
          content: true,
          mediaUrls: true,
          createdAt: true,
          author: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
          group: { select: { id: true, name: true } },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.post.count({ where }),
    ]);
    return { posts, total, page, pageSize };
  }
}
