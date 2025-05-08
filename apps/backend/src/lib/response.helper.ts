import { Response } from 'express';
import { ApiErrorResponse, ApiSuccessResponse, createErrorResponse, createSuccessResponse } from '../types/api.types';

/**
 * Helper class to standardize API responses across all controllers
 */
export class ResponseHelper {
  /**
   * Send a success response with standardized format
   * @param res Express response object
   * @param data Payload data to send in the response
   * @param message Success message
   * @param statusCode HTTP status code (defaults to 200)
   */
  static success<T>(
    res: Response,
    data: T,
    message = 'Operation successful',
    statusCode = 200
  ): Response<ApiSuccessResponse<T>> {
    return res.status(statusCode).json(createSuccessResponse(data, message));
  }

  /**
   * Send an error response with standardized format
   * @param res Express response object
   * @param message Error message
   * @param statusCode HTTP status code (defaults to 400)
   * @param errors Optional array of field-specific errors
   * @param payload Optional payload to include with error
   */
  static error(
    res: Response,
    message: string,
    statusCode = 400,
    errors?: Array<{ field: string; message: string }>,
    payload?: any
  ): Response<ApiErrorResponse> {
    return res.status(statusCode).json(createErrorResponse(message, errors, payload));
  }

  /**
   * Send a not found error response
   * @param res Express response object
   * @param entity Name of the entity that wasn't found (e.g., 'User', 'Project')
   */
  static notFound(res: Response, entity: string): Response<ApiErrorResponse> {
    return ResponseHelper.error(res, `${entity} not found`, 404);
  }

  /**
   * Send an unauthorized error response
   * @param res Express response object
   * @param message Custom message (defaults to 'Authentication required')
   */
  static unauthorized(res: Response, message = 'Authentication required'): Response<ApiErrorResponse> {
    return ResponseHelper.error(res, message, 401);
  }
}