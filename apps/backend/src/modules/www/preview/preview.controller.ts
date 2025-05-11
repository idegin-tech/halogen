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
      
      // Fetch project variables
      const variables = await VariableModel.find({ project: project._id });
      
      const path = req.query.path ? String(req.query.path) : '/';
      const currentPage = pages.find(page => page.path === path) || pages[0];
      
      const pageBlocks = blockInstances.filter(
        //@ts-ignore
        block => block.page.toString() === currentPage?._id?.toString()
      );
      
      const response = {
        project: {
          id: project._id,
          name: project.name,
          subdomain: project.subdomain,
          project_id: project.project_id
        },
        pages: pages.map(page => ({
          id: page._id,
          name: page.name,
          path: page.path,
          page_id: page.page_id,
          isStatic: page.isStatic
        })),
        currentPage: {
          id: currentPage._id,
          name: currentPage.name,
          path: currentPage.path,
          page_id: currentPage.page_id,
          isStatic: currentPage.isStatic
        },        blocks: pageBlocks.map(block => ({
          instance_id: block.instance_id,
          page_id: block.page_id,
          index: block.index,
          folderName: block.folderName,
          subFolder: block.subFolder,
          value: block.value,
          ref: block.ref
        })),
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
      
      ResponseHelper.success(res, response, 'Project data retrieved successfully');
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