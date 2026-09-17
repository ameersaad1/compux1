import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';
import { ChatGateway } from './sockets/chat.socket.js';

async function main() {
  const app = createApp();
  const httpServer = http.createServer(app);

  // eslint-disable-next-line no-new
  new ChatGateway(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 Compux API listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    httpServer.close(async () => {
      await prisma.$disconnect();
      redis.disconnect();
      process.exit(0);
    });
    // Force-exit if something hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error during startup');
  process.exit(1);
});
