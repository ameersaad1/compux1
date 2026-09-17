import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import cookie from 'cookie';
import { TokenService } from '../utils/jwt.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';
import { MessageService } from '../services/message.service.js';

interface AuthedSocket extends Socket {
  userId?: string;
}

/**
 * Encapsulates all real-time chat behaviour. Every socket must present a
 * valid access-token cookie (the same one used for REST calls) before it is
 * allowed to join a conversation room or emit anything - there is no
 * anonymous/unauthenticated messaging path.
 */
export class ChatGateway {
  private io: Server;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: { origin: env.CLIENT_URL, credentials: true },
    });

    this.io.use(this.authenticate);
    this.io.on('connection', (socket) => this.onConnection(socket as AuthedSocket));
  }

  private authenticate = (socket: Socket, next: (err?: Error) => void) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;
      const token = rawCookie ? cookie.parse(rawCookie).accessToken : undefined;
      if (!token) return next(new Error('UNAUTHENTICATED'));

      const payload = TokenService.verifyAccessToken(token);
      (socket as AuthedSocket).userId = payload.sub;
      next();
    } catch {
      next(new Error('UNAUTHENTICATED'));
    }
  };

  private onConnection(socket: AuthedSocket) {
    const userId = socket.userId!;
    logger.debug({ userId, socketId: socket.id }, 'socket connected');

    // A personal room lets other services push events (new DM, new
    // notification) to every tab/device a user has open.
    socket.join(`user:${userId}`);

    socket.on('conversation:join', async (conversationPartnerId: string) => {
      const canMessage = await MessageService.canDirectMessage(userId, conversationPartnerId);
      if (!canMessage) return;
      socket.join(ChatGateway.roomFor(userId, conversationPartnerId));
    });

    socket.on(
      'message:send',
      async (payload: { toUserId: string; encryptedContent: string; iv: string }, ack?: (res: unknown) => void) => {
        try {
          const encryptedContent = (payload?.encryptedContent ?? '').slice(0, 8000);
          const iv = (payload?.iv ?? '').slice(0, 64);
          if (!encryptedContent || !iv || !payload?.toUserId) return;

          const canMessage = await MessageService.canDirectMessage(userId, payload.toUserId);
          if (!canMessage) {
            return ack?.({ error: 'لا يمكنك مراسلة هذا المستخدم.' });
          }

          // The server only ever stores/relays the ciphertext produced by the
          // sender's browser (see client `utils/crypto.ts`); it never has the
          // key material needed to read message content.
          const message = await prisma.directMessage.create({
            data: { senderId: userId, recipientId: payload.toUserId, encryptedContent, iv },
            include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
          });

          const room = ChatGateway.roomFor(userId, payload.toUserId);
          this.io.to(room).emit('message:new', message);
          this.io.to(`user:${payload.toUserId}`).emit('message:notification', { fromUserId: userId });

          ack?.({ message });
        } catch (err) {
          logger.error({ err }, 'message:send failed');
          ack?.({ error: 'تعذر إرسال الرسالة.' });
        }
      }
    );

    socket.on('typing', ({ toUserId }: { toUserId: string }) => {
      if (!toUserId) return;
      this.io.to(`user:${toUserId}`).emit('typing', { fromUserId: userId });
    });

    socket.on('disconnect', () => {
      logger.debug({ userId, socketId: socket.id }, 'socket disconnected');
    });
  }

  private static roomFor(userA: string, userB: string): string {
    return `dm:${[userA, userB].sort().join(':')}`;
  }
}
