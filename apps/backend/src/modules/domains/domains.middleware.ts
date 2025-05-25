import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import Logger from '../../config/logger.config';

export const domainRateLimiter = rateLimit({
  windowMs: 90 * 60 * 1000, // 1 hour
  max: 50, 
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: 'Too many domain operations, please try again later',
  handler: (req: Request, res: Response) => {
    Logger.warn(`Rate limit exceeded for domain operations: ${req.ip}`);
    return res.status(429).json({
      success: false,
      message: 'Too many domain operations, please try again later',
      error: 'Rate limit exceeded'
    });
  }
});

export const projectDomainLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required',
        error: 'Bad request'
      });
    }
    
    const projectService = req.app.locals.projectService;
    const project = await projectService.getProjectById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        error: 'Not found'
      });
    }
    
    const domainService = req.app.locals.domainService;
    const domains = await domainService.getDomainsByProject(projectId, { limit: 1000 });
    
    const tierLimits = {
      free: 1,
      starter: 3,
      professional: 10,
      enterprise: 50
    };
    
    const tier = project.tier || 'free';
    const limit = tierLimits[tier as keyof typeof tierLimits] || 1;
    
    if (domains.totalDocs >= limit && req.method === 'POST') {
      return res.status(403).json({
        success: false,
        message: `Your ${tier} plan allows a maximum of ${limit} custom domains`,
        error: 'Domain limit exceeded'
      });
    }
    
    next();
  } catch (error) {
    Logger.error(`Domain limit middleware error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    next(error);
  }
};
