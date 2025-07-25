import { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { createErrorResponse } from '../../types/api.types';
import { ProjectUserStatus } from '@halogen/common';
import { ProjectUserModel } from '../project-users';
import Logger from '../../config/logger.config';

declare module 'express' {
  interface Request {
    session: session.Session & {
      userId?: string;
    };
    isAuthenticated?: boolean;
    user?: {
      id: string;
    };
  }
}

export class AuthMiddleware {  static requireAuth(req: Request, res: Response, next: NextFunction): void {
    Logger.debug(`AuthMiddleware: requireAuth called for ${req.method} ${req.url}`);
    Logger.debug(`AuthMiddleware: Session exists: ${!!req.session}`);
    Logger.debug(`AuthMiddleware: Session ID: ${req.session?.id}`);
    Logger.debug(`AuthMiddleware: User ID in session: ${req.session?.userId}`);
    
    if (!req.session || !req.session.userId) {
      Logger.warn(`AuthMiddleware: Authentication required but no valid session found`);
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }
    
    Logger.info(`AuthMiddleware: User authenticated - ID: ${req.session.userId}`);
    
    req.user = {
      id: req.session.userId
    };
    
    next();
  }

  static optionalAuth(req: Request, res: Response, next: NextFunction): void {
    if (req.session && req.session.userId) {
      req.isAuthenticated = true;
      req.user = {
        id: req.session.userId
      };
    } else {
      req.isAuthenticated = false;
    }
    next();
  }

  static async requireProjectAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!req.session || !req.session.userId) {
      res.status(401).json(createErrorResponse('Authentication required'));
      return;
    }

    const projectId = req.params.projectId;
    if (!projectId) {
      res.status(400).json(createErrorResponse('Project ID is required'));
      return;
    }

    try {
      const projectUser = await ProjectUserModel.findOne({
        project: projectId,
        user: req.session.userId,
        status: ProjectUserStatus.ACTIVE
      });

      if (!projectUser) {
        console.log('INVALID PROJECT USER:::', {
          projectId,
          userId: req.session.userId
        })
        res.status(403).json(createErrorResponse('You do not have access to this project'));
        return;
      }

      req.user = {
        id: req.session.userId
      };

      next();
    } catch (error) {
      res.status(500).json(createErrorResponse('Failed to verify project access'));
    }
  }
}