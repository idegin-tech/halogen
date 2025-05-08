import { Request, Response } from 'express';
import { ProjectsService } from './projects.service';
import { ResponseHelper } from '../../lib/response.helper';
import { CreateProjectDTO, UpdateProjectDTO, SyncProjectDTO } from './projects.dtos';
import { ProjectQueryOptions } from '@halogen/common';

export class ProjectsController {
  static async createProject(req: Request, res: Response): Promise<void> {
    try {
      const projectData = req.body as CreateProjectDTO;
      const userId = req.session.userId;
      
      if (!userId) {
        ResponseHelper.unauthorized(res);
        return;
      }
      
      const project = await ProjectsService.createProject(userId, projectData);
      
      ResponseHelper.success(res, project, 'Project created successfully', 201);
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to create project', 
        400
      );
    }
  }
  
  static async getProjects(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        ResponseHelper.unauthorized(res);
        return;
      }
      
      const queryOptions: ProjectQueryOptions = {
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };
      
      const paginatedProjects = await ProjectsService.getUserProjects(userId, queryOptions);
      
      ResponseHelper.success(res, paginatedProjects, 'Projects retrieved successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to retrieve projects', 
        500
      );
    }
  }
  
  static async getProjectById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const project = await ProjectsService.getProjectById(id);
      
      if (!project) {
        ResponseHelper.notFound(res, 'Project');
        return;
      }
      
      ResponseHelper.success(res, project, 'Project retrieved successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to retrieve project', 
        500
      );
    }
  }
  
  static async getProjectBySubdomain(req: Request, res: Response): Promise<void> {
    try {
      const { subdomain } = req.params;
      
      const project = await ProjectsService.getProjectBySubdomain(subdomain);
      
      if (!project) {
        ResponseHelper.notFound(res, 'Project');
        return;
      }
      
      ResponseHelper.success(res, project, 'Project retrieved successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to retrieve project', 
        500
      );
    }
  }
  
  static async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const projectData = req.body as UpdateProjectDTO;
      
      const updatedProject = await ProjectsService.updateProject(id, projectData);
      
      if (!updatedProject) {
        ResponseHelper.notFound(res, 'Project');
        return;
      }
      
      ResponseHelper.success(res, updatedProject, 'Project updated successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to update project', 
        400
      );
    }
  }
  
  static async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const deleted = await ProjectsService.deleteProject(id);
      
      if (!deleted) {
        ResponseHelper.notFound(res, 'Project');
        return;
      }
      
      ResponseHelper.success(res, { id }, 'Project deleted successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to delete project', 
        500
      );
    }
  }
  
  static async syncProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const syncData = req.body as SyncProjectDTO;
      
      const syncResult = await ProjectsService.syncProject(id, syncData);
      
      ResponseHelper.success(res, syncResult, 'Project synchronized successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to synchronize project data', 
        400
      );
    }
  }
}