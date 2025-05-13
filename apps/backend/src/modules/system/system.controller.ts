import { Request, Response } from 'express';
import { ResponseHelper } from '../../lib/response.helper';
import Logger from '../../config/logger.config';

export class SystemController {
  static async getModules(req: Request, res: Response): Promise<void> {
    try {
      // List all available modules
      const modules = [
        { name: 'auth', description: 'User authentication and authorization' },
        { name: 'projects', description: 'Project management' },
        { name: 'project-users', description: 'Project user management' },
        { name: 'project-metadata', description: 'Project SEO metadata management' },
        { name: 'pages', description: 'Page management' },
        { name: 'variables', description: 'Variable management' },
        { name: 'block-instances', description: 'Block instance management' },
        { name: 'preview', description: 'Project preview' }
      ];
      
      ResponseHelper.success(res, modules, 'Modules retrieved successfully');
    } catch (error) {
      Logger.error(`Get modules error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to retrieve modules', 
        500
      );
    }
  }
}
