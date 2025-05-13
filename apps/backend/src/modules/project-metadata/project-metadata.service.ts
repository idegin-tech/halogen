import { ProjectMetadata } from '@halogen/common';
import { CreateProjectMetadataDTO, UpdateProjectMetadataDTO } from './project-metadata.dtos';
import ProjectMetadataModel from './project-metadata.model';
import Logger from '../../config/logger.config';

export class ProjectMetadataService {
    static async createProjectMetadata(metadataData: CreateProjectMetadataDTO): Promise<ProjectMetadata> {
        try {
            const newMetadata = new ProjectMetadataModel(metadataData);
            const savedMetadata = await newMetadata.save();

            const metadataObj = savedMetadata.toObject();
            return {
                ...metadataObj,
                _id: metadataObj._id as string
            };
        } catch (error) {
            Logger.error(`Create project metadata error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async getProjectMetadataById(id: string): Promise<ProjectMetadata | null> {
        try {
            const metadata = await ProjectMetadataModel.findById(id);
            if (!metadata) return null;
            
            const metadataObj = metadata.toObject();
            return {
                ...metadataObj,
                _id: metadataObj._id as string
            };
        } catch (error) {
            Logger.error(`Get project metadata error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async getProjectMetadataByProjectId(projectId: string): Promise<ProjectMetadata | null> {
        try {
            const metadata = await ProjectMetadataModel.findOne({ project: projectId });
            if (!metadata) return null;
            
            const metadataObj = metadata.toObject();
            return {
                ...metadataObj,
                _id: metadataObj._id as string
            };
        } catch (error) {
            Logger.error(`Get project metadata by project ID error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async updateProjectMetadata(id: string, updateData: UpdateProjectMetadataDTO): Promise<ProjectMetadata | null> {
        try {
            const updatedMetadata = await ProjectMetadataModel.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true }
            );

            if (!updatedMetadata) return null;
            
            const metadataObj = updatedMetadata.toObject();
            return {
                ...metadataObj,
                _id: metadataObj._id as string
            };
        } catch (error) {
            Logger.error(`Update project metadata error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async updateProjectMetadataByProjectId(projectId: string, updateData: UpdateProjectMetadataDTO): Promise<ProjectMetadata | null> {
        try {
            const updatedMetadata = await ProjectMetadataModel.findOneAndUpdate(
                { project: projectId },
                { $set: updateData },
                { new: true }
            );

            if (!updatedMetadata) return null;
            
            const metadataObj = updatedMetadata.toObject();
            return {
                ...metadataObj,
                _id: metadataObj._id as string
            };
        } catch (error) {
            Logger.error(`Update project metadata by project ID error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async deleteProjectMetadata(id: string): Promise<boolean> {
        try {
            const deleteResult = await ProjectMetadataModel.deleteOne({ _id: id });
            return deleteResult.deletedCount > 0;
        } catch (error) {
            Logger.error(`Delete project metadata error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async deleteProjectMetadataByProjectId(projectId: string): Promise<boolean> {
        try {
            const deleteResult = await ProjectMetadataModel.deleteOne({ project: projectId });
            return deleteResult.deletedCount > 0;
        } catch (error) {
            Logger.error(`Delete project metadata by project ID error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
}
