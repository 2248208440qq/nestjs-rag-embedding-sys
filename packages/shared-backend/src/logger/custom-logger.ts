import { ConsoleLogger, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'node:os';
import { inspect } from 'node:util';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import { requestContext } from './request-context';

export type LogLevel = 'debug' | 'verbose' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  nodeEnv: string;
  logLevel: LogLevel;
  logDir: string;
  logToFile: boolean;
  logServiceName: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
};

@Injectable()
export class CustomLogger extends ConsoleLogger {
  private readonly winstonLogger: winston.Logger | null;
  private readonly enabledLevels: LogLevel[];
  private readonly config: LoggerConfig;

  constructor(@Optional() configService?: ConfigService) {
    super();

    this.config = this.resolveConfig(configService);
    this.enabledLevels = this.resolveEnabledLevels(this.config.logLevel);
    this.winstonLogger = this.createWinstonLogger();
  }

  override log(message: unknown, context?: string): void {
    if (!this.shouldLog('info', message)) {
      return;
    }

    super.log(message, context);
    this.persist('info', message, context);
  }

  override error(message: unknown, stack?: string, context?: string): void {
    if (!this.shouldLog('error', message)) {
      return;
    }

    const normalizedStack = stack ?? (message instanceof Error ? message.stack : undefined);
    const normalizedMessage = message instanceof Error ? message.message : message;

    super.error(normalizedMessage, normalizedStack, context);
    this.persist('error', message, context, normalizedStack);
  }

  override warn(message: unknown, context?: string): void {
    if (!this.shouldLog('warn', message)) {
      return;
    }

    super.warn(message, context);
    this.persist('warn', message, context);
  }

  override debug(message: unknown, context?: string): void {
    if (!this.shouldLog('debug', message)) {
      return;
    }

    super.debug(message, context);
    this.persist('debug', message, context);
  }

  override verbose(message: unknown, context?: string): void {
    if (!this.shouldLog('verbose', message)) {
      return;
    }

    super.verbose(message, context);
    this.persist('verbose', message, context);
  }

  private resolveConfig(configService?: ConfigService): LoggerConfig {
    const nodeEnv = configService?.get<string>('NODE_ENV') ?? 'development';
    const defaultLevel = nodeEnv === 'production' ? 'info' : 'debug';

    return {
      nodeEnv,
      logLevel: this.normalizeLevel(
        configService?.get<string>('LOG_LEVEL') ?? defaultLevel,
      ),
      logDir: configService?.get<string>('LOG_DIR') ?? 'logs',
      logToFile: configService?.get<string>('LOG_TO_FILE') === 'true',
      logServiceName:
        configService?.get<string>('LOG_SERVICE_NAME') ??
        configService?.get<string>('APP_NAME') ??
        'backend',
    };
  }

  private normalizeLevel(level: string): LogLevel {
    return ['debug', 'verbose', 'info', 'warn', 'error'].includes(level)
      ? (level as LogLevel)
      : 'info';
  }

  private resolveEnabledLevels(level: LogLevel): LogLevel[] {
    const allLevels: LogLevel[] = ['debug', 'verbose', 'info', 'warn', 'error'];
    const start = allLevels.indexOf(level);

    return start >= 0 ? allLevels.slice(start) : ['info', 'warn', 'error'];
  }

  private shouldLog(level: LogLevel, message: unknown): boolean {
    return message !== undefined && this.enabledLevels.includes(level);
  }

  private createWinstonLogger(): winston.Logger | null {
    const transports: winston.transport[] = [];
    const jsonFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    );

    if (this.config.nodeEnv === 'production') {
      transports.push(
        new DailyRotateFile({
          dirname: `${this.config.logDir}/info`,
          filename: 'application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          level: 'info',
          format: jsonFormat,
        }),
        new DailyRotateFile({
          dirname: `${this.config.logDir}/error`,
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '90d',
          level: 'error',
          format: jsonFormat,
        }),
      );
    } else if (this.config.logToFile) {
      transports.push(
        new DailyRotateFile({
          dirname: `${this.config.logDir}/app`,
          filename: 'app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: false,
          maxSize: '10m',
          maxFiles: '7d',
          level: this.config.logLevel,
          format: jsonFormat,
        }),
      );
    }

    if (transports.length === 0) {
      return null;
    }

    return winston.createLogger({
      levels: LOG_LEVELS,
      level: this.config.logLevel,
      format: jsonFormat,
      defaultMeta: {
        service: this.config.logServiceName,
        host: os.hostname(),
        pid: process.pid,
      },
      transports,
    });
  }

  private persist(
    level: LogLevel,
    message: unknown,
    context?: string,
    stack?: string,
  ): void {
    if (!this.winstonLogger) {
      return;
    }

    const requestMeta = requestContext.getStore();
    const meta: Record<string, unknown> = {
      context: context ?? this.context ?? 'unknown',
      ...requestMeta,
    };

    if (stack) {
      meta.stack = stack;
    }

    this.winstonLogger.log(level, this.formatLogMessage(message), meta);
  }

  private formatLogMessage(message: unknown): string {
    if (message === null) {
      return '[null]';
    }

    if (message instanceof Error) {
      return message.message || 'Error without message';
    }

    if (typeof message === 'object') {
      try {
        return JSON.stringify(message);
      } catch {
        return inspect(message, { depth: 5, colors: false });
      }
    }

    return String(message);
  }
}
