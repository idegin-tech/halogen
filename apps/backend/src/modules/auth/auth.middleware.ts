import { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { createErrorResponse } from '../../types/api.types';

declare module 'express' {
  interface Request {
    session: session.Session & {
      userId?: string;
    };
    isAuthenticated?: boolean;
  }
}

export class AuthMiddleware {
  static requireAuth(req: Request, res: Response, next: NextFunction): void {
    if (!req.session || !req.session.userId) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }
    next();
  }

  static optionalAuth(req: Request, res: Response, next: NextFunction): void {
    if (req.session && req.session.userId) {
      req.isAuthenticated = true;
    } else {
      req.isAuthenticated = false;
    }
    next();
  }
}