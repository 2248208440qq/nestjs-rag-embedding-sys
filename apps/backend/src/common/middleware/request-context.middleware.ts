import { randomUUID } from 'node:crypto';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { requestContext } from '@repo/shared-backend';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    const startedAt = Date.now();
    const requestId = request.header('x-request-id') ?? randomUUID();

    response.setHeader('x-request-id', requestId);

    requestContext.run(
      {
        requestId,
        method: request.method,
        path: request.originalUrl,
        clientIp: request.ip,
      },
      () => {
        response.on('finish', () => {
          const store = requestContext.getStore();

          if (store) {
            store.statusCode = response.statusCode;
            store.durationMs = Date.now() - startedAt;
          }
        });

        next();
      },
    );
  }
}
