import { Request, Response } from 'express';
import { ResponseHelper } from '../../lib/response.helper';
import Logger from '../../config/logger.config';
import ProjectSettingsService from './project-settings.service';
import { UpdateProjectFontsDTO } from './project-settings.dto';

/**
 * Project Settings Controller
 */
export class ProjectSettingsController {
  /**
   * Update project fonts
   * 
   * @param req - Express request object
   * @param res - Express response object
   */
  static async updateProjectFonts(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId;
      const fontsData = req.body as UpdateProjectFontsDTO;
      
      if (!projectId) {
        ResponseHelper.error(res, 'Project ID is required', 400);
        return;
      }

      const updatedSettings = await ProjectSettingsService.updateSettings(projectId, {
        ...(fontsData.headingFont && { headingFont: fontsData.headingFont }),
        ...(fontsData.bodyFont && { bodyFont: fontsData.bodyFont })
      });

      if (!updatedSettings) {
        ResponseHelper.error(res, 'Project settings not found', 404);
        return;
      }

      ResponseHelper.success(res, updatedSettings, 'Project fonts updated successfully');
    } catch (error) {
      Logger.error(`Error updating project fonts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      ResponseHelper.error(
        res,
        error instanceof Error ? error.message : 'Failed to update project fonts',
        500
      );
    }
  }
}

export default ProjectSettingsController;
