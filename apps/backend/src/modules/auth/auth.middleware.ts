import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@halogen/common';
import session from 'express-session';
import { createErrorResponse } from '../../types/api.types';

declare module 'express' {
  interface Request {
    session: session.Session & {
      userId?: string;
      userRole?: UserRole;
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

  static requireAdmin(req: Request, res: Response, next: NextFunction): void {
    if (!req.session || !req.session.userId || req.session.userRole !== UserRole.ADMIN) {
      res.status(403).json(createErrorResponse('Admin access required'));
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