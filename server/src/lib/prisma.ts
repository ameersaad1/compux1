import { PrismaClient } from '@prisma/client';
import { isProduction } from '../config/env.js';

/**
 * A single shared PrismaClient instance for the whole process. Creating a
 * new client per request (or per import, under hot-reload) exhausts the
 * database connection pool - this pattern is the documented Prisma fix.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: isProduction ? ['error', 'warn'] : ['error', 'warn', 'query'],
  });

if (!isProduction) {
  global.__prisma = prisma;
}
