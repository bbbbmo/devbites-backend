import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { createDailyRotateTransport } from './winston.config';

export const cronLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
      ({ level, message, timestamp }) =>
        `[${timestamp}] [CRON] [${level.toUpperCase()}] ${message}`,
    ),
  ),
  transports: [
    createDailyRotateTransport('cron'),
    new winston.transports.Console(),
  ],
});
