import type { ErrorCode, ErrorDetail } from './error';

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  path: string;
}

export interface ApiSuccessResponse<T> {
  status: 'success';
  code: number;
  timestamp: string;
  message: string;
  data: T;
  meta?: ApiMeta;
  path?: string;
  requestId?: string;
}

export interface ApiErrorResponse {
  status?: 'error';
  code: number;
  timestamp: string;
  message: string | string[];
  errorCode: ErrorCode;
  error?: string | {
    code: string;
    message: string;
    details?: ErrorDetail[];
  };
  meta?: ApiMeta;
  path: string;
  method: string;
  requestId?: string;
  stack?: string;
  details?: ErrorDetail;
}
