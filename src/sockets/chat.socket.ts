import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redisPublisher = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const redisSubscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface DirectMessagePayload {
  recipientId: string;
  encryptedContent: string;
  iv: string;
}

let isSubscriberInitialized = false;

export function registerChatSocket(io: Server): void {
  // تفعيل الاشتراك في Redis مرة واحدة فقط للكل لمنع مضاعفة الاستماع
  if (!isSubscriberInitialized) {
    redisSubscriber.subscribe('CHAT_MESSAGES');
    redisSubscriber.on('message', (channel: string, message: string) => {
      if (channel === 'CHAT_MESSAGES') {
        try {
          const parsed = JSON.parse(message);
          if (parsed && parsed.recipientId) {
            io.to(`user:${parsed.recipientId}`).emit('new_message', parsed);
          }
        } catch (err) {
          console.error('خطأ في تحليلات رسالة Redis PubSub:', err);
        }
      }
    });
    isSubscriberInitialized = true;
  }

  // Middleware للتحقق من هوية الاتصال
  io.use((socket: AuthenticatedSocket, next: (err?: Error) => void) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId || typeof userId !== 'string') {
      return next(new Error('غير مصرح: معرف المستخدم مفقود أو غير صالح'));
    }
    socket.userId = userId;
    return next();
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    socket.join(`user:${userId}`);

    socket.on('send_direct_message', async (data: DirectMessagePayload) => {
      try {
        const { recipientId, encryptedContent, iv } = data;

        if (!recipientId || !encryptedContent || !iv) {
          return socket.emit('error', { message: 'جميع بيانات الرسالة المشفرة مطلوبة.' });
        }

        const recipient = await prisma.user.findUnique({
          where: { id: recipientId },
          select: { allowDM: true, isPrivate: true },
        });

        if (!recipient) {
          return socket.emit('error', { message: 'المستلم غير موجود.' });
        }

        if (recipient.allowDM === 'NONE') {
          return socket.emit('error', { message: 'هذا المستخدم يغلق خاصية الرسائل المباشرة.' });
        }

        const followRelation = await prisma.follower.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId,
              followingId: recipientId,
            },
          },
        });

        const isFollower = followRelation?.status === 'ACCEPTED';

        if (recipient.allowDM === 'FOLLOWERS_ONLY' && !isFollower) {
          return socket.emit('error', { message: 'يمكن للمتابعين فقط إرسال رسائل لهذا الحساب.' });
        }

        if (!isFollower) {
          await prisma.messageRequest.upsert({
            where: {
              senderId_recipientId: { senderId: userId, recipientId },
            },
            create: { senderId: userId, recipientId, status: 'PENDING' },
            update: {},
          });
        }

        const savedMessage = await prisma.directMessage.create({
          data: {
            senderId: userId,
            recipientId,
            encryptedContent,
            iv,
          },
        });

        await redisPublisher.publish('CHAT_MESSAGES', JSON.stringify(savedMessage));
        return socket.emit('message_sent', savedMessage);
      } catch (err) {
        console.error('خطأ إرسال الرسالة عبر Socket:', err);
        return socket.emit('error', { message: 'حدث خطأ أثناء معالجة وإرسال الرسالة.' });
      }
    });

    socket.on('disconnect', () => {
      socket.leave(`user:${userId}`);
    });
  });
}
