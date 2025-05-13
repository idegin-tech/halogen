import { Request, Response } from 'express';
import { ProjectMetadataService } from './project-metadata.service';
import { ResponseHelper } from '../../lib/response.helper';
import { CreateProjectMetadataDTO, UpdateProjectMetadataDTO } from './project-metadata.dtos';

export class ProjectMetadataController {
  static async createProjectMetadata(req: Request, res: Response): Promise<void> {
    try {
      const metadataData = req.body as CreateProjectMetadataDTO;
      
      const metadata = await ProjectMetadataService.createProjectMetadata(metadataData);
      
      ResponseHelper.success(res, metadata, 'Project metadata created successfully', 201);
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to create project metadata', 
        400
      );
    }
  }
  
  static async getProjectMetadataById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const metadata = await ProjectMetadataService.getProjectMetadataById(id);
      
      if (!metadata) {
        ResponseHelper.notFound(res, 'Project metadata');
        return;
      }
      
      ResponseHelper.success(res, metadata, 'Project metadata retrieved successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to retrieve project metadata', 
        500
      );
    }
  }
    static async getProjectMetadataByProjectId(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      
      let metadata = await ProjectMetadataService.getProjectMetadataByProjectId(projectId);
      
      if (!metadata) {
        // Create default metadata if it doesn't exist
        const defaultMetadata = {
          project: projectId,
          title: '',
          description: ''
        };
        
        try {
          metadata = await ProjectMetadataService.createProjectMetadata(defaultMetadata);
        } catch (createError) {
          // If creation fails (e.g. due to race condition), try to get it again
          metadata = await ProjectMetadataService.getProjectMetadataByProjectId(projectId);
          
          if (!metadata) {
            ResponseHelper.notFound(res, 'Project metadata');
            return;
          }
        }
      }
      
      ResponseHelper.success(res, metadata, 'Project metadata retrieved successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to retrieve project metadata', 
        500
      );
    }
  }
  
  static async updateProjectMetadata(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const metadataData = req.body as UpdateProjectMetadataDTO;
      
      const updatedMetadata = await ProjectMetadataService.updateProjectMetadata(id, metadataData);
      
      if (!updatedMetadata) {
        ResponseHelper.notFound(res, 'Project metadata');
        return;
      }
      
      ResponseHelper.success(res, updatedMetadata, 'Project metadata updated successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to update project metadata', 
        400
      );
    }
  }
  
  static async updateProjectMetadataByProjectId(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const metadataData = req.body as UpdateProjectMetadataDTO;
      
      const updatedMetadata = await ProjectMetadataService.updateProjectMetadataByProjectId(projectId, metadataData);
      
      if (!updatedMetadata) {
        ResponseHelper.notFound(res, 'Project metadata');
        return;
      }
      
      ResponseHelper.success(res, updatedMetadata, 'Project metadata updated successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to update project metadata', 
        400
      );
    }
  }
  
  static async deleteProjectMetadata(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const deleted = await ProjectMetadataService.deleteProjectMetadata(id);
      
      if (!deleted) {
        ResponseHelper.notFound(res, 'Project metadata');
        return;
      }
      
      ResponseHelper.success(res, { id }, 'Project metadata deleted successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to delete project metadata', 
        500
      );
    }
  }
  
  static async deleteProjectMetadataByProjectId(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      
      const deleted = await ProjectMetadataService.deleteProjectMetadataByProjectId(projectId);
      
      if (!deleted) {
        ResponseHelper.notFound(res, 'Project metadata');
        return;
      }
      
      ResponseHelper.success(res, { projectId }, 'Project metadata deleted successfully');
    } catch (error) {
      ResponseHelper.error(
        res, 
        error instanceof Error ? error.message : 'Failed to delete project metadata', 
        500
      );
    }
  }
}
