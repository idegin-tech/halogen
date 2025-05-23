import { Request, Response } from 'express';
import { ResponseHelper } from '../../lib/response.helper';
import Logger from '../../config/logger.config';
import path from 'path';
import fs from 'fs';
import { BlockThumbnailUtil } from '@halogen/common';

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

  static async getBlockThumbnail(req: Request, res: Response): Promise<void> {
    try {
      const { folderName, subFolder } = req.query;
      
      if (!folderName || !subFolder) {
        ResponseHelper.error(res, 'Missing required parameters: folderName and subFolder', 400);
        return;
      }

      // Get thumbnail path using the utility from common package
      const thumbnailPath = BlockThumbnailUtil.getThumbnailPath(
        folderName as string, 
        subFolder as string
      );
      
      // Construct the absolute path to the thumbnail
      // This assumes UI package is in the node_modules directory
      const absolutePath = path.resolve(
        process.cwd(), 
        'node_modules', 
        '@repo', 
        'ui', 
        'blocks', 
        thumbnailPath
      );

      // Check if the file exists
      if (!fs.existsSync(absolutePath)) {
        ResponseHelper.error(res, 'Thumbnail not found', 404);
        return;
      }

      // Send the file
      res.sendFile(absolutePath);
    } catch (error) {
      Logger.error(`Get block thumbnail error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to retrieve block thumbnail', 
        500
      );
    }
  }
}
