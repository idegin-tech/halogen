import { Types } from 'mongoose';
import ProjectSettings, { IProjectSettings } from './project-settings.model';
import Logger from '../../config/logger.config';

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
  public static async createDefaultSettings(projectId: Types.ObjectId | string): Promise<IProjectSettings> {
    try {
      const defaultSettings = new ProjectSettings({
        project: projectId,
        headingFont: 'Inter',
        bodyFont: 'Inter'
      });
      
      await defaultSettings.save();
      Logger.info(`Created default project settings for project: ${projectId}`);
      
      return defaultSettings;
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
  public static async getByProjectId(projectId: Types.ObjectId | string): Promise<IProjectSettings | null> {
    try {
      return await ProjectSettings.findOne({ project: projectId });
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
    settings: Partial<Pick<IProjectSettings, 'headingFont' | 'bodyFont'>>
  ): Promise<IProjectSettings | null> {
    try {
      return await ProjectSettings.findOneAndUpdate(
        { project: projectId },
        { $set: settings },
        { new: true, runValidators: true }
      );
    } catch (error) {
      Logger.error(`Error updating settings for project ${projectId}: ${error}`);
      throw error;
    }
  }
}

export default ProjectSettingsService;
