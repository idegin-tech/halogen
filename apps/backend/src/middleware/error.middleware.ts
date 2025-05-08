import { Request, Response, NextFunction } from 'express';
import Logger from '../config/logger.config';
import { createErrorResponse } from '../types/api.types';

export class ErrorHandlerMiddleware {
  static handleError(err: any, req: Request, res: Response, next: NextFunction): void {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    Logger.error(`Error: ${message} - Path: ${req.path} - Method: ${req.method} - IP: ${req.ip}`);
    
    if (err.stack) {
      Logger.error(`Stack: ${err.stack}`);
    }
    
    res.status(statusCode).json(createErrorResponse(
      message,
      process.env.NODE_ENV === 'development' ? [{ field: 'stack', message: err.stack }] : undefined
    ));
  }

  static handleNotFound(req: Request, res: Response): void {
    Logger.warn(`Not Found: ${req.method} ${req.path} - IP: ${req.ip}`);
    
    res.status(404).json(createErrorResponse('Resource not found'));
  }
}