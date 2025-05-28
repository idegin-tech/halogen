import { Response } from 'express';
import { ApiErrorResponse, ApiSuccessResponse, createErrorResponse, createSuccessResponse } from '../types/api.types';

export class ResponseHelper {
  static success<T>(
    res: Response,
    data: T,
    message = 'Operation successful',
    statusCode = 200
  ): Response<ApiSuccessResponse<T>> {
    return res.status(statusCode).json(createSuccessResponse(data, message));
  }

  static error(
    res: Response,
    message: string,
    statusCode = 400,
    errors?: Array<{ field: string; message: string }>,
    payload?: any
  ): Response<ApiErrorResponse> {
    return res.status(statusCode).json(createErrorResponse(message, errors, payload));
  }

 
  static notFound(res: Response, entity: string): Response<ApiErrorResponse> {
    return ResponseHelper.error(res, `${entity} not found`, 404);
  }

  static unauthorized(res: Response, message = 'Authentication required'): Response<ApiErrorResponse> {
    return ResponseHelper.error(res, message, 401);
  }
}