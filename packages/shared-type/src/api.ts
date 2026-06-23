export type ApiStatus = 'success' | 'error';

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  path: string;
}

export interface ApiSuccessResponse<T> {
  status: 'success';
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  status: 'error';
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  meta: ApiMeta;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
