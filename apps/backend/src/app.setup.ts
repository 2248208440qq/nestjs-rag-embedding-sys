import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { CustomLogger } from '@repo/shared-backend';
import type { NextFunction, Request, Response } from 'express';

import { ResponseExceptionFilter } from './common/filters/response-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { AppConfigService } from './config/app-config.service';

export function setupApp(app: INestApplication) {
  const logger = app.get(CustomLogger);
  const config = app.get(AppConfigService);
  const requestContextMiddleware = new RequestContextMiddleware();
  const requestLoggerMiddleware = new RequestLoggerMiddleware(logger);

  app.useLogger(logger);
  app.setGlobalPrefix('api');
  app.use((request: Request, response: Response, next: NextFunction) =>
    requestContextMiddleware.use(request, response, next),
  );
  app.use((request: Request, response: Response, next: NextFunction) =>
    requestLoggerMiddleware.use(request, response, next),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new ResponseExceptionFilter(logger, config));
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.enableCors();
}
