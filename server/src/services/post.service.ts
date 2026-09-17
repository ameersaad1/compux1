import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { NotificationService } from './notification.service.js';

const AUTHOR_SELECT = {
  id: true,
  username: true,
  fullName: true,
  avatarUrl: true,
  isVerified: true,
} as const;

function extractHashtags(content: string): string[] {
  return Array.from(new Set((content.match(/#[\p{L}0-9_]+/gu) ?? []).map((h) => h.slice(1).toLowerCase())));
}

function extractMentions(content: string): string[] {
  return Array.from(new Set((content.match(/@[\p{L}0-9_]+/gu) ?? []).map((m) => m.slice(1).toLowerCase())));
}

export class PostService {
  static async createPost(authorId: string, content: string, mediaUrls: string[] = [], groupId?: string) {
    const trimmed = content.trim();
    if (!trimmed && mediaUrls.length === 0) {
      throw AppError.badRequest('لا يمكن نشر منشور فارغ.');
    }
    if (trimmed.length > 3000) throw AppError.badRequest('المنشور طويل جداً (الحد الأقصى 3000 حرف).');

    // Posting into a group requires membership in it - otherwise anyone
    // could inject posts into a group's feed (public or private) without
    // ever having joined it.
    if (groupId) {
      const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: authorId } } });
      if (!membership) throw AppError.forbidden('يجب أن تكون عضواً في المجموعة للنشر فيها.');
    }

    const hashtags = extractHashtags(trimmed);
    const mentions = extractMentions(trimmed);

    const post = await prisma.post.create({
      data: { authorId, content: trimmed, mediaUrls, hashtags, mentions, groupId },
      include: { author: { select: AUTHOR_SELECT } },
    });

    if (mentions.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: { username: { in: mentions } },
        select: { id: true },
      });
      await Promise.all(
        mentionedUsers.map((u) =>
          u.id === authorId
            ? Promise.resolve()
            : NotificationService.create({ recipientId: u.id, actorId: authorId, type: 'MENTION', entityId: post.id })
        )
      );
    }

    return post;
  }

  static async deletePost(postId: string, requesterId: string, requesterRole: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw AppError.notFound('المنشور غير موجود.');
    const isOwner = post.authorId === requesterId;
    const isModerator = ['ADMIN', 'MODERATOR'].includes(requesterRole);
    if (!isOwner && !isModerator) throw AppError.forbidden('لا يمكنك حذف منشور لا يخصك.');
    await prisma.post.delete({ where: { id: postId } });
  }

  /** Cursor-based pagination - stable and efficient even as the feed grows large. */
  static async getFeed(viewerId: string, cursor?: string, take = 15) {
    const following = await prisma.follower.findMany({
      where: { followerId: viewerId, status: 'ACCEPTED' },
      select: { followingId: true },
    });
    const authorIds = [viewerId, ...following.map((f) => f.followingId)];

    const posts = await prisma.post.findMany({
      where: { authorId: { in: authorIds } },
      include: {
        author: { select: AUTHOR_SELECT },
        likes: { where: { userId: viewerId }, select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = posts.length > take;
    const page = posts.slice(0, take).map((p) => ({ ...p, isLikedByViewer: p.likes.length > 0, likes: undefined }));

    return { posts: page, nextCursor: hasMore ? posts[take]?.id : null };
  }

  static async getUserPosts(username: string, cursor?: string, take = 15) {
    const author = await prisma.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true } });
    if (!author) throw AppError.notFound('المستخدم غير موجود.');

    const posts = await prisma.post.findMany({
      where: { authorId: author.id, groupId: null },
      include: { author: { select: AUTHOR_SELECT } },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = posts.length > take;
    return { posts: posts.slice(0, take), nextCursor: hasMore ? posts[take]?.id : null };
  }

  /** A group's own feed - only members of a private group may view it. */
  static async getGroupPosts(groupId: string, viewerId: string | undefined, cursor?: string, take = 15) {
    const group = await prisma.group.findUnique({ where: { id: groupId }, select: { isPrivate: true } });
    if (!group) throw AppError.notFound('المجموعة غير موجودة.');
    if (group.isPrivate) {
      const membership = viewerId
        ? await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: viewerId } } })
        : null;
      if (!membership) throw AppError.forbidden('هذا المحتوى مقتصر على أعضاء المجموعة.');
    }

    const posts = await prisma.post.findMany({
      where: { groupId },
      include: {
        author: { select: AUTHOR_SELECT },
        likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = posts.length > take;
    const page = posts.slice(0, take).map((p) => ({ ...p, isLikedByViewer: (p.likes?.length ?? 0) > 0, likes: undefined }));
    return { posts: page, nextCursor: hasMore ? posts[take]?.id : null };
  }

  /** Toggle like; uses the unique (postId, userId) constraint to stay race-safe under concurrent clicks. */
  static async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
    if (!post) throw AppError.notFound('المنشور غير موجود.');

    const existing = await prisma.like.findUnique({ where: { postId_userId: { postId, userId } } });

    if (existing) {
      const [, updated] = await prisma.$transaction([
        prisma.like.delete({ where: { id: existing.id } }),
        prisma.post.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } }),
      ]);
      return { liked: false, likesCount: updated.likesCount };
    }

    const [, updated] = await prisma.$transaction([
      prisma.like.create({ data: { postId, userId } }),
      prisma.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } }),
    ]);

    if (post.authorId !== userId) {
      await NotificationService.create({ recipientId: post.authorId, actorId: userId, type: 'LIKE', entityId: postId });
    }

    return { liked: true, likesCount: updated.likesCount };
  }

  static async addComment(postId: string, authorId: string, content: string, parentId?: string) {
    const trimmed = content.trim();
    if (!trimmed) throw AppError.badRequest('لا يمكن إضافة تعليق فارغ.');
    if (trimmed.length > 1000) throw AppError.badRequest('التعليق طويل جداً.');

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
    if (!post) throw AppError.notFound('المنشور غير موجود.');

    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: { postId, authorId, content: trimmed, parentId },
        include: { author: { select: AUTHOR_SELECT } },
      }),
      prisma.post.update({ where: { id: postId }, data: { commentsCount: { increment: 1 } } }),
    ]);

    if (post.authorId !== authorId) {
      await NotificationService.create({ recipientId: post.authorId, actorId: authorId, type: 'COMMENT', entityId: postId });
    }

    return comment;
  }

  static async getComments(postId: string) {
    return prisma.comment.findMany({
      where: { postId, parentId: null },
      include: {
        author: { select: AUTHOR_SELECT },
        replies: { include: { author: { select: AUTHOR_SELECT } }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
