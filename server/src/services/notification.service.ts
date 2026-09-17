import { prisma } from '../lib/prisma.js';
import type { NotificationType } from '@prisma/client';

export interface CreateNotificationInput {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  entityId?: string;
}

export class NotificationService {
  static async create(input: CreateNotificationInput) {
    if (input.recipientId === input.actorId) return null; // never notify yourself
    return prisma.notification.create({ data: input });
  }

  static async listForUser(userId: string, take = 30) {
    return prisma.notification.findMany({
      where: { recipientId: userId },
      include: { actor: { select: { id: true, username: true, fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  static async markAllRead(userId: string) {
    await prisma.notification.updateMany({ where: { recipientId: userId, isRead: false }, data: { isRead: true } });
  }

  static async unreadCount(userId: string) {
    return prisma.notification.count({ where: { recipientId: userId, isRead: false } });
  }
}
