import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';

export class EventService {
  /**
   * Events inherit their group's privacy: an event that belongs to a
   * private group must not be listed to (or joinable by) anyone who isn't
   * a member of that group, regardless of whether they filtered by
   * `groupId` or are just browsing the general events list.
   */
  static async listUpcoming(groupId?: string, viewerId?: string) {
    if (groupId) {
      const group = await prisma.group.findUnique({ where: { id: groupId }, select: { isPrivate: true } });
      if (!group) throw AppError.notFound('المجموعة غير موجودة.');
      if (group.isPrivate) {
        const membership = viewerId
          ? await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: viewerId } } })
          : null;
        if (!membership) throw AppError.forbidden('هذا المحتوى مقتصر على أعضاء المجموعة.');
      }
      return prisma.event.findMany({
        where: { startTime: { gte: new Date() }, groupId },
        orderBy: { startTime: 'asc' },
        include: { group: { select: { id: true, name: true, avatarUrl: true } } },
      });
    }

    const events = await prisma.event.findMany({
      where: { startTime: { gte: new Date() } },
      orderBy: { startTime: 'asc' },
      include: { group: { select: { id: true, name: true, avatarUrl: true, isPrivate: true } } },
    });

    const privateGroupIds = Array.from(new Set(events.filter((e) => e.group.isPrivate).map((e) => e.groupId)));
    if (privateGroupIds.length === 0) return events;

    const myMemberships = viewerId
      ? await prisma.groupMember.findMany({
          where: { userId: viewerId, groupId: { in: privateGroupIds } },
          select: { groupId: true },
        })
      : [];
    const myGroupIds = new Set(myMemberships.map((m) => m.groupId));

    return events.filter((e) => !e.group.isPrivate || myGroupIds.has(e.groupId));
  }

  static async create(groupId: string, requesterId: string, data: {
    title: string; description: string; location: string; startTime: Date; endTime: Date; capacity: number;
  }) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: requesterId } },
    });
    if (!membership || !['MODERATOR', 'ADMIN'].includes(membership.role)) {
      throw AppError.forbidden('يجب أن تكون مشرفاً على المجموعة لإنشاء فعالية.');
    }
    if (data.endTime <= data.startTime) throw AppError.badRequest('وقت الانتهاء يجب أن يكون بعد وقت البدء.');

    return prisma.event.create({ data: { ...data, groupId } });
  }

  /**
   * RSVP under concurrency: two users hitting "Reserve seat" on the last
   * spot at the same instant must not both succeed. We do the
   * capacity check and the increment inside one serializable transaction,
   * and rely on the EventRSVP unique(eventId,userId) constraint to reject
   * duplicate RSVPs from the same user.
   */
  static async rsvp(eventId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId }, include: { group: { select: { isPrivate: true } } } });
      if (!event) throw AppError.notFound('الفعالية غير موجودة.');
      if (event.group.isPrivate) {
        const membership = await tx.groupMember.findUnique({
          where: { groupId_userId: { groupId: event.groupId, userId } },
        });
        if (!membership) throw AppError.forbidden('يجب أن تكون عضواً في المجموعة للتسجيل في هذه الفعالية.');
      }
      if (event.startTime < new Date()) throw AppError.badRequest('انتهى وقت التسجيل لهذه الفعالية.');

      const existing = await tx.eventRSVP.findUnique({
        where: { eventId_userId: { eventId, userId } },
      });
      if (existing) throw AppError.conflict('أنت مسجل بالفعل في هذه الفعالية.');

      if (event.filledSeats >= event.capacity) {
        throw AppError.conflict('اكتمل عدد المقاعد المتاحة لهذه الفعالية.');
      }

      const updateResult = await tx.event.updateMany({
        where: { id: eventId, filledSeats: { lt: event.capacity } }, // optimistic guard against a concurrent RSVP
        data: { filledSeats: { increment: 1 } },
      });
      if (updateResult.count === 0) {
        throw AppError.conflict('اكتمل عدد المقاعد المتاحة لهذه الفعالية.');
      }

      await tx.eventRSVP.create({ data: { eventId, userId } });
      return tx.event.findUniqueOrThrow({ where: { id: eventId } });
    }, { isolationLevel: 'Serializable' });
  }

  static async cancelRsvp(eventId: string, userId: string) {
    await prisma.$transaction(async (tx) => {
      const rsvp = await tx.eventRSVP.findUnique({ where: { eventId_userId: { eventId, userId } } });
      if (!rsvp) throw AppError.notFound('لست مسجلاً في هذه الفعالية.');
      await tx.eventRSVP.delete({ where: { id: rsvp.id } });
      await tx.event.update({ where: { id: eventId }, data: { filledSeats: { decrement: 1 } } });
    });
  }
}
