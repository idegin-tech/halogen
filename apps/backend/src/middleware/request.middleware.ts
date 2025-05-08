import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { createErrorResponse } from '../types/api.types';

export class RequestValidation {
  static validateBody = (schema: AnyZodObject) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        req.body = await schema.parseAsync(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json(createErrorResponse(
            'Invalid request data',
            error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          ));
        }
        next(error);
      }
    };
  };

  static validateQuery = (schema: AnyZodObject) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        req.query = await schema.parseAsync(req.query);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json(createErrorResponse(
            'Invalid query parameters',
            error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          ));
        }
        next(error);
      }
    };
  };

  static validateParams = (schema: AnyZodObject) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        req.params = await schema.parseAsync(req.params);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json(createErrorResponse(
            'Invalid route parameters',
            error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          ));
        }
        next(error);
      }
    };
  };
}