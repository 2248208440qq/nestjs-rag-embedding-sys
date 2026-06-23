import type { ApiErrorResponse, ApiSuccessResponse } from '@repo/shared-types'

export type IApiSuccessResponse<T> = ApiSuccessResponse<T>;
export type IErrorResponse = ApiErrorResponse;
