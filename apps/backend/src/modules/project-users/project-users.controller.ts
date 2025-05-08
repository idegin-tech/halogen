import { Request, Response } from 'express';
import { ProjectUserService } from './project-users.service';
import { ResponseHelper } from '../../lib/response.helper';
import { CreateProjectUserDTO, UpdateProjectUserDTO } from './project-users.dtos';
import { ProjectUserQueryOptions } from '@halogen/common';

export class ProjectUserController {
  static async createProjectUser(req: Request, res: Response): Promise<void> {
    try {
      const projectUserData = req.body as CreateProjectUserDTO;
      
      const projectUser = await ProjectUserService.createProjectUser(projectUserData);
      
      ResponseHelper.success(res, projectUser, 'Project user created successfully', 201);
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to create project user', 
        400
      );
    }
  }
  
  static async getProjectUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const projectUser = await ProjectUserService.getProjectUserById(id);
      
      if (!projectUser) {
        ResponseHelper.notFound(res, 'Project user');
        return;
      }
      
      ResponseHelper.success(res, projectUser, 'Project user retrieved successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to retrieve project user', 
        500
      );
    }
  }
  
  static async getProjectUsers(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      
      // Extract query parameters
      const queryOptions: ProjectUserQueryOptions = {
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        status: req.query.status as any
      };
      
      const paginatedProjectUsers = await ProjectUserService.getProjectUsers(projectId, queryOptions);
      
      ResponseHelper.success(res, paginatedProjectUsers, 'Project users retrieved successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to retrieve project users', 
        500
      );
    }
  }
  
  static async updateProjectUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const projectUserData = req.body as UpdateProjectUserDTO;
      
      const updatedProjectUser = await ProjectUserService.updateProjectUser(id, projectUserData);
      
      if (!updatedProjectUser) {
        ResponseHelper.notFound(res, 'Project user');
        return;
      }
      
      ResponseHelper.success(res, updatedProjectUser, 'Project user updated successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to update project user', 
        400
      );
    }
  }
  
  static async deleteProjectUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const deleted = await ProjectUserService.deleteProjectUser(id);
      
      if (!deleted) {
        ResponseHelper.notFound(res, 'Project user');
        return;
      }
      
      ResponseHelper.success(res, { id }, 'Project user deleted successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to delete project user', 
        500
      );
    }
  }
}