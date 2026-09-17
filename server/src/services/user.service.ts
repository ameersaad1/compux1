import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';

export interface UpdateProfileInput {
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  isPrivate?: boolean;
  allowDM?: 'EVERYONE' | 'FOLLOWERS_ONLY' | 'NONE';
  identityPublicKey?: string;
}

const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  fullName: true,
  avatarUrl: true,
  coverImageUrl: true,
  bio: true,
  universityName: true,
  graduationYear: true,
  role: true,
  isPrivate: true,
  isVerified: true,
  createdAt: true,
  identityPublicKey: true,
  verificationBadge: { select: { status: true } },
} as const;

export class UserService {
  static async getPublicProfile(username: string, viewerId?: string) {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        ...PUBLIC_USER_SELECT,
        _count: { select: { followers: true, following: true, posts: true } },
      },
    });
    if (!user) throw AppError.notFound('المستخدم غير موجود.');

    let isFollowing = false;
    let followStatus: string | null = null;
    if (viewerId && viewerId !== user.id) {
      const rel = await prisma.follower.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
      });
      isFollowing = rel?.status === 'ACCEPTED';
      followStatus = rel?.status ?? null;
    }

    return { ...user, isFollowing, followStatus, isOwnProfile: viewerId === user.id };
  }

  static async updateProfile(userId: string, input: UpdateProfileInput) {
    return prisma.user.update({
      where: { id: userId },
      data: input,
      select: PUBLIC_USER_SELECT,
    });
  }

  static async searchUsers(query: string, limit = 20) {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];
    return prisma.user.findMany({
      where: {
        isBanned: false,
        OR: [
          { username: { contains: trimmed, mode: 'insensitive' } },
          { fullName: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      select: { id: true, username: true, fullName: true, avatarUrl: true, isVerified: true },
      take: limit,
    });
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...PUBLIC_USER_SELECT,
        email: true,
        emailVerifiedAt: true,
        allowDM: true,
        _count: { select: { followers: true, following: true, posts: true } },
      },
    });
    if (!user) throw AppError.notFound('المستخدم غير موجود.');
    return user;
  }

  static async requestVerification(userId: string, studentIdCardUrl: string) {
    const existing = await prisma.verificationBadge.findUnique({ where: { userId } });
    if (existing && existing.status === 'PENDING') {
      throw AppError.conflict('لديك طلب توثيق قيد المراجعة بالفعل.');
    }
    if (existing && existing.status === 'APPROVED') {
      throw AppError.conflict('حسابك موثّق بالفعل.');
    }

    return prisma.verificationBadge.upsert({
      where: { userId },
      update: { status: 'PENDING', studentIdCardUrl, rejectionReason: null },
      create: { userId, status: 'PENDING', studentIdCardUrl },
    });
  }
}
