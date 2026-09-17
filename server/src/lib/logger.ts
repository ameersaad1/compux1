import pino from 'pino';
import { isProduction } from '../config/env.js';

/**
 * Structured logging. In production this emits single-line JSON that a log
 * aggregator (Datadog, CloudWatch, Loki, ...) can parse; in development it
 * pretty-prints for a human reading the terminal.
 */
export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
  redact: ['req.headers.cookie', 'req.headers.authorization', '*.password', '*.passwordHash'],
});
