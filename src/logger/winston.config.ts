import * as winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, context, stack }) => {
  return `[${timestamp}] [${level.toUpperCase()}]${context ? ` [${context}]` : ''} ${stack || message}`;
});

export const createDailyRotateTransport = (filename: string) =>
  new winston.transports.DailyRotateFile({
    dirname: 'logs',
    filename: `${filename}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
  });

export const winstonConfig = {
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat,
  ),
  transports: [
    createDailyRotateTransport('app'),
    createDailyRotateTransport('error'),
    new winston.transports.Console(),
  ],
};
