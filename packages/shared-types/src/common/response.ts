import type { ErrorCode, ErrorDetail } from './error';

export interface ApiSuccessResponse<T> {
  code: number;
  timestamp: string;
  message: string;
  data: T;
  path?: string;
  requestId?: string;
}

export interface ApiErrorResponse {
  code: number;
  timestamp: string;
  message: string | string[];
  errorCode: ErrorCode;
  path: string;
  method: string;
  requestId?: string;
  error?: string;
  stack?: string;
  details?: ErrorDetail;
}
