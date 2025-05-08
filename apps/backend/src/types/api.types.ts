export type ApiResponseStatus = 'success' | 'error';

export interface ApiResponse {
  status: ApiResponseStatus;
  message: string;
  timestamp: string;
  payload?: any;
}

export interface ApiSuccessResponse<T = any> extends ApiResponse {
  status: 'success';
  payload: T;
}

export interface ApiErrorResponse extends ApiResponse {
  status: 'error';
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export function createSuccessResponse<T>(payload: T, message = 'Operation successful'): ApiSuccessResponse<T> {
  return {
    status: 'success',
    message,
    timestamp: new Date().toISOString(),
    payload
  };
}

export function createErrorResponse(
  message: string, 
  errors?: Array<{ field: string; message: string }>,
  payload?: any
): ApiErrorResponse {
  return {
    status: 'error',
    message,
    timestamp: new Date().toISOString(),
    ...(payload && { payload }),
    ...(errors && { errors })
  };
}