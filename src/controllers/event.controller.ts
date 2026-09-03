import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from './authAndPrivacy.controller';

const prisma = new PrismaClient();

export class EventController {
  /**
   * حجز مقعد في الفعالية باستخدام القفل الحصري لمكافحة السباق الحرج (Race Condition)
   */
  static async rsvpToEvent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'غير مصرح.' });
      }

      // تشغيل المعاملة باستعمال التنافسية المحمية (Interactive Transaction)
      const result = await prisma.$transaction(async (tx) => {
        // تنفيذ الاستعلام بالقفل الحصري raw query لتحقيق FOR UPDATE
        const events: any[] = await tx.$queryRaw`
          SELECT id, capacity, "filledSeats" 
          FROM "Event" 
          WHERE id = ${eventId}::uuid 
          FOR UPDATE
        `;

        const event = events[0];
        if (!event) {
          throw new Error('EVENT_NOT_FOUND');
        }

        if (event.filledSeats >= event.capacity) {
          throw new Error('EVENT_FULL');
        }

        // فحص هل المستخدم مسجل سابقاً
        const existingRSVP = await tx.eventRSVP.findUnique({
          where: {
            eventId_userId: { eventId, userId },
          },
        });

        if (existingRSVP) {
          throw new Error('ALREADY_REGISTERED');
        }

        // إنشاء الحجز وتحديث العداد
        const newRSVP = await tx.eventRSVP.create({
          data: { eventId, userId },
        });

        await tx.event.update({
          where: { id: eventId },
          data: { filledSeats: { increment: 1 } },
        });

        return newRSVP;
      });

      return res.status(200).json({
        message: 'تم تأكيد حجز المقعد بنجاح.',
        rsvp: result,
      });
    } catch (error: any) {
      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({ error: 'الفعالية غير موجودة.' });
      }
      if (error.message === 'EVENT_FULL') {
        return res.status(400).json({ error: 'عذراً، الفعالية ممتلئة بالكامل.' });
      }
      if (error.message === 'ALREADY_REGISTERED') {
        return res.status(409).json({ error: 'أنت مسجل بالفعل في هذه الفعالية.' });
      }
      return next(error);
    }
  }
}
