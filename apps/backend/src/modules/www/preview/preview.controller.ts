import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ResponseHelper } from '../../../lib/response.helper';
import ProjectModel from '../../projects/projects.model';
import PageModel from '../../artifacts/pages/pages.model';
import BlockInstanceModel from '../../artifacts/block-instance/block-instances.model';
import VariableModel from '../../artifacts/variables/variables.model';
import ProjectMetadataModel from '../../project-metadata/project-metadata.model';
import { ProjectSettingsService } from '../../project-settings/project-settings.service';
import Logger from '../../../config/logger.config';

export class PreviewController {
  static async getProjectDataBySubdomain(req: Request, res: Response): Promise<void> {
    try {
      const { subdomain } = req.params;

      if (!subdomain) {
        ResponseHelper.error(res, 'Subdomain is required', 400);
        return;
      }

      const project = await ProjectModel.findOne({ subdomain });

      if (!project) {
        ResponseHelper.error(res, 'Project not found', 404);
        return;
      }

      // Cast project document to access _id safely
      const projectObj = project as any;
      const projectId = projectObj._id;

      const pages = await PageModel.find({ project: projectId });

      if (!pages || pages.length === 0) {
        ResponseHelper.error(res, 'No pages found for this project', 404);
        return;
      }
      
      const blockInstances = await BlockInstanceModel.find({ project: projectId });
      const variables = await VariableModel.find({ project: projectId });
      const metadata = await ProjectMetadataModel.findOne({ project: projectId });
      
      // Get project settings for fonts
      const projectSettings = await ProjectSettingsService.getByProjectId(projectId.toString());

      ResponseHelper.success(res, {
        variables,
        pages,
        blocks: blockInstances,
        metadata: metadata || undefined,
        settings: projectSettings ? {
          headingFont: projectSettings.headingFont,
          bodyFont: projectSettings.bodyFont
        } : null
      }, 'Project data retrieved successfully');
    } catch (error) {
      Logger.error(`Preview error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      ResponseHelper.error(
        res,
        error instanceof Error ? error.message : 'Failed to retrieve project data',
        500
      );
    }
  }
}