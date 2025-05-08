export type ApiResponseStatus = 'success' | 'error';

export interface ApiSuccessResponse<T> {
  status: 'success';
  data: T;
}

export interface ApiErrorResponse {
  status: 'error';
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function createSuccessResponse<T>(data: T): ApiSuccessResponse<T> {
  return {
    status: 'success',
    data
  };
}

export function createErrorResponse(message: string, errors?: Array<{ field: string; message: string }>): ApiErrorResponse {
  return {
    status: 'error',
    message,
    ...(errors && { errors })
  };
}