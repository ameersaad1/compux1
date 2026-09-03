import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redisPublisher = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const redisSubscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function registerChatSocket(io: Server) {
  // الاشتراك في قناة Redis Pub/Sub للرسائل بين الخوادم المتعددة
  redisSubscriber.subscribe('CHAT_MESSAGES');
  redisSubscriber.on('message', (channel, message) => {
    if (channel === 'CHAT_MESSAGES') {
      const parsed = JSON.parse(message);
      io.to(`user:${parsed.recipientId}`).emit('new_message', parsed);
    }
  });

  io.use((socket: AuthenticatedSocket, next) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId) {
      return next(new Error('غير مصرح: ID المستخدم مفقود'));
    }
    socket.userId = userId;
    next();
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    socket.join(`user:${userId}`);

    // إرسال رسالة مباشرة جديدة
    socket.on('send_direct_message', async (data) => {
      try {
        const { recipientId, encryptedContent, iv } = data;

        // 1. فحص إعدادات الخصوصية والمنع
        const recipient = await prisma.user.findUnique({
          where: { id: recipientId },
          select: { allowDM: true, isPrivate: true },
        });

        if (!recipient) {
          return socket.emit('error', { message: 'المستخدم غير موجود' });
        }

        if (recipient.allowDM === 'NONE') {
          return socket.emit('error', { message: 'هذا المستخدم لا يقبل الرسائل المباشرة' });
        }

        // 2. فحص حالة المتابعة لطلبات الرسائل (Message Requests)
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
          return socket.emit('error', { message: 'يمكن للمتابعين فقط إرسال رسائل لهذا الحساب' });
        }

        // 3. إنشاء طلب رسالة (Message Request) إذا لم يكن متابعاً
        if (!isFollower) {
          await prisma.messageRequest.upsert({
            where: {
              senderId_recipientId: { senderId: userId, recipientId },
            },
            create: { senderId: userId, recipientId, status: 'PENDING' },
            update: {},
          });
        }

        // 4. حفظ الرسالة المشفرة في قاعدة البيانات
        const savedMessage = await prisma.directMessage.create({
          data: {
            senderId: userId,
            recipientId,
            encryptedContent,
            iv,
          },
        });

        const payload = JSON.stringify(savedMessage);

        // 5. النشر عبر Redis Pub/Sub للإرسال المباشر
        await redisPublisher.publish('CHAT_MESSAGES', payload);

        // تأكيد الإرسال للطرف المنسق
        socket.emit('message_sent', savedMessage);
      } catch (err) {
        socket.emit('error', { message: 'فشل في إرسال الرسالة' });
      }
    });

    socket.on('disconnect', () => {
      socket.leave(`user:${userId}`);
    });
  });
}
