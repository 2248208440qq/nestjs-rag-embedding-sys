import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CustomLogger, requestContext } from '@repo/shared-backend';
import type { ApiErrorResponse, ErrorCode } from '@repo/shared-types';
import type { Request, Response } from 'express';

import { AppConfigService } from '../../config/app-config.service';

@Catch()
export class ResponseExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: CustomLogger,
    private readonly config: AppConfigService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;
    const message = this.resolveMessage(exception, exceptionResponse);
    const timestamp = new Date().toISOString();
    const requestId = requestContext.getStore()?.requestId;
    const errorCode = this.resolveErrorCode(status);
    const errorResponse: ApiErrorResponse = {
      status: 'error',
      code: status,
      timestamp,
      message,
      errorCode,
      error: {
        code: errorCode,
        message: Array.isArray(message) ? message.join('; ') : message,
      },
      meta: {
        requestId: requestId ?? '',
        timestamp,
        path: request.originalUrl,
      },
      path: request.originalUrl,
      method: request.method,
      requestId,
      stack:
        this.config.isProduction
          ? undefined
          : exception instanceof Error
            ? exception.stack
            : undefined,
    };

    if (status >= 500) {
      this.logger.error(exception, undefined, ResponseExceptionFilter.name);
    } else {
      this.logger.warn(
        `${request.method} ${request.originalUrl} failed: ${JSON.stringify(message)}`,
        ResponseExceptionFilter.name,
      );
    }

    response.status(status).json(errorResponse);
  }

  private resolveMessage(
    exception: unknown,
    exceptionResponse: string | object | null,
  ): string | string[] {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const message = exceptionResponse.message;

      return Array.isArray(message) || typeof message === 'string'
        ? message
        : 'Request failed';
    }

    return exception instanceof Error ? exception.message : 'Internal server error';
  }

  private resolveErrorCode(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
