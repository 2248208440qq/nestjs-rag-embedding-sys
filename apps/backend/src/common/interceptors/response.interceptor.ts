import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { requestContext } from '@repo/shared-backend';
import type { ApiSuccessResponse } from '@repo/shared-types';
import type { Request } from 'express';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const store = requestContext.getStore();

    return next.handle().pipe(
      map((data) => ({
        status: 'success' as const,
        code: 0,
        timestamp: new Date().toISOString(),
        message: 'success',
        data,
        meta: {
          requestId: store?.requestId ?? '',
          timestamp: new Date().toISOString(),
          path: request.originalUrl,
        },
        path: request.originalUrl,
        requestId: store?.requestId,
      })),
    );
  }
}
