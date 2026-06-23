import { Injectable, NestMiddleware } from '@nestjs/common';
import { CustomLogger, requestContext } from '@repo/shared-backend';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: CustomLogger) {}

  use(request: Request, response: Response, next: NextFunction) {
    const startedAt = Date.now();

    response.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const store = requestContext.getStore();
      const message = `${request.method} ${request.originalUrl} ${response.statusCode} ${durationMs}ms`;

      if (store) {
        store.statusCode = response.statusCode;
        store.durationMs = durationMs;
      }

      if (response.statusCode >= 500) {
        this.logger.error(message, undefined, RequestLoggerMiddleware.name);
        return;
      }

      if (response.statusCode >= 400) {
        this.logger.warn(message, RequestLoggerMiddleware.name);
        return;
      }

      this.logger.log(message, RequestLoggerMiddleware.name);
    });

    next();
  }
}
