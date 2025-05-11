import { Request, Response } from 'express';
import { ResponseHelper } from '../../../lib/response.helper';
import ProjectModel from '../../projects/projects.model';
import PageModel from '../../artifacts/pages/pages.model';
import BlockInstanceModel from '../../artifacts/block-instance/block-instances.model';
import VariableModel from '../../artifacts/variables/variables.model';
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

      const pages = await PageModel.find({ project: project._id });

      if (!pages || pages.length === 0) {
        ResponseHelper.error(res, 'No pages found for this project', 404);
        return;
      }
      const blockInstances = await BlockInstanceModel.find({ project: project._id });

      const variables = await VariableModel.find({ project: project._id });

      ResponseHelper.success(res, {
        variables,
        pages,
        blocks: blockInstances,
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

  static async getProjectVariablesForLayout(req: Request, res: Response): Promise<void> {
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

      // Fetch project variables only
      const variables = await VariableModel.find({ project: project._id });

      const response = {
        project: {
          id: project._id,
          name: project.name,
          subdomain: project.subdomain,
          project_id: project.project_id
        },
        variables: variables.map(variable => ({
          variable_id: variable.variable_id,
          name: variable.name,
          key: variable.key,
          type: variable.type,
          primaryValue: variable.primaryValue,
          secondaryValue: variable.secondaryValue,
          variableSet: variable.variableSet
        }))
      };

      ResponseHelper.success(res, response, 'Project variables retrieved successfully');
    } catch (error) {
      Logger.error(`Preview layout variables error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      ResponseHelper.error(
        res,
        error instanceof Error ? error.message : 'Failed to retrieve layout variables',
        500
      );
    }
  }
}