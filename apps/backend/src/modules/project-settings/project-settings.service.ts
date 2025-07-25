import { Types } from 'mongoose';
import ProjectSettings from './project-settings.model';
import Logger from '../../config/logger.config';
import { ProjectSettings as ProjectSettingsType } from '@halogen/common/types';

/**
 * Project Settings Service class with methods to manage project settings
 */
export class ProjectSettingsService {
  /**
   * Create default project settings for a new project
   * 
   * @param projectId - The ID of the project
   * @returns The created project settings document
   */
  public static async createDefaultSettings(projectId: Types.ObjectId | string): Promise<ProjectSettingsType> {
    try {
      const defaultSettings = new ProjectSettings({
        project: projectId,
        headingFont: 'Inter',
        bodyFont: 'Inter'
      });      
      await defaultSettings.save();
      Logger.info(`Created default project settings for project: ${projectId}`);
      const settingsObj = defaultSettings.toObject();
      return {
        _id: settingsObj._id?.toString(),
        project: settingsObj.project?.toString(),
        createdAt: settingsObj.createdAt?.toISOString(),
        updatedAt: settingsObj.updatedAt?.toISOString(),
        headingFont: settingsObj.headingFont,
        bodyFont: settingsObj.bodyFont,
        integrations: settingsObj.integrations
      };
    } catch (error) {
      Logger.error(`Failed to create default project settings for project ${projectId}: ${error}`);
      throw error;
    }
  }

  /**
   * Get project settings by project ID
   * 
   * @param projectId - The ID of the project
   * @returns The project settings or null if not found
   */
  public static async getByProjectId(projectId: Types.ObjectId | string): Promise<ProjectSettingsType | null> {
    try {      const settings = await ProjectSettings.findOne({ project: projectId });
      if (!settings) return null;
      
      const settingsObj = settings.toObject();
      return {
        _id: settingsObj._id?.toString(),
        project: settingsObj.project?.toString(),
        createdAt: settingsObj.createdAt?.toISOString(),
        updatedAt: settingsObj.updatedAt?.toISOString(),
        headingFont: settingsObj.headingFont,
        bodyFont: settingsObj.bodyFont,
        integrations: settingsObj.integrations
      };
    } catch (error) {
      Logger.error(`Error fetching project settings for project ${projectId}: ${error}`);
      throw error;
    }
  }

  /**
   * Update project settings
   * 
   * @param projectId - The ID of the project
   * @param settings - The settings to update
   * @returns The updated project settings
   */  
  public static async updateSettings(
    projectId: Types.ObjectId | string,
    settings: Partial<Pick<ProjectSettingsType, 'headingFont' | 'bodyFont'>>
  ): Promise<ProjectSettingsType | null> {
    try {
      const updatedSettings = await ProjectSettings.findOneAndUpdate(
        { project: projectId },
        { $set: settings },
        { new: true, runValidators: true }
      );      
      if (!updatedSettings) return null;
      
      const settingsObj = updatedSettings.toObject();
      return {
        _id: settingsObj._id?.toString(),
        project: settingsObj.project?.toString(),
        createdAt: settingsObj.createdAt?.toISOString(),
        updatedAt: settingsObj.updatedAt?.toISOString(),
        headingFont: settingsObj.headingFont,
        bodyFont: settingsObj.bodyFont,
        integrations: settingsObj.integrations
      };
    } catch (error) {
      Logger.error(`Error updating settings for project ${projectId}: ${error}`);
      throw error;
    }
  }
}

export default ProjectSettingsService;
