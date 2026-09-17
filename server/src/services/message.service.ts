import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';

const PARTY_SELECT = {
  id: true,
  username: true,
  fullName: true,
  avatarUrl: true,
  isVerified: true,
  identityPublicKey: true,
} as const;

export class MessageService {
  /** Direct messages require an accepted follow relationship or a fully-open DM policy. Shared by the REST API and the socket gateway so the rule can never drift between the two. */
  static async canDirectMessage(fromUserId: string, toUserId: string): Promise<boolean> {
    if (fromUserId === toUserId) return false;
    const target = await prisma.user.findUnique({ where: { id: toUserId }, select: { allowDM: true } });
    if (!target) return false;
    if (target.allowDM === 'NONE') return false;
    if (target.allowDM === 'EVERYONE') return true;

    const followsBack = await prisma.follower.findUnique({
      where: { followerId_followingId: { followerId: toUserId, followingId: fromUserId } },
    });
    return followsBack?.status === 'ACCEPTED';
  }

  /** One row per distinct conversation partner, most recent message first. */
  static async listConversations(userId: string) {
    const messages = await prisma.directMessage.findMany({
      where: { OR: [{ senderId: userId }, { recipientId: userId }] },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: PARTY_SELECT },
        recipient: { select: PARTY_SELECT },
      },
    });

    const seen = new Map<string, (typeof messages)[number]>();
    for (const m of messages) {
      const partner = m.senderId === userId ? m.recipient : m.sender;
      if (!seen.has(partner.id)) seen.set(partner.id, m);
    }

    return Array.from(seen.entries()).map(([partnerId, lastMessage]) => ({
      partner: lastMessage.senderId === userId ? lastMessage.recipient : lastMessage.sender,
      lastMessage,
      partnerId,
    }));
  }

  static async getHistory(userId: string, partnerUsername: string, take = 50) {
    const partner = await prisma.user.findUnique({
      where: { username: partnerUsername.toLowerCase() },
      select: PARTY_SELECT,
    });
    if (!partner) throw AppError.notFound('المستخدم غير موجود.');

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: partner.id },
          { senderId: partner.id, recipientId: userId },
        ],
      },
      include: { sender: { select: PARTY_SELECT } },
      orderBy: { createdAt: 'asc' },
      take,
    });

    // Fire-and-forget read receipt update; the caller doesn't need to wait on it.
    void prisma.directMessage.updateMany({
      where: { senderId: partner.id, recipientId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { partner, messages };
  }
}
