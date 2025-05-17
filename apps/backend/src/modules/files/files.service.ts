import { FilterQuery, PaginateOptions, PaginateResult } from 'mongoose';
import FileModel, { FileDocument } from './files.model';
import Logger from '../../config/logger.config';
import { FileQueryOptions } from '@halogen/common';

// Keep the same property names but remove optional properties to ensure all required fields are present
interface FileCreatePayload {
  project: string;
  path: string;
  name: string;
  extension: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
  thumbnailUrl?: string;
  user: string;
}

interface FileUpdatePayload {
  path?: string;
  name?: string;
  extension?: string;
  mimeType?: string;
  size?: number;
  downloadUrl?: string;
  thumbnailUrl?: string;
  updatedAt?: Date;
}

export class FilesService {
  static async createFile(fileData: FileCreatePayload): Promise<FileDocument> {
    const file = new FileModel(fileData);
    await file.save();
    return file;
  }

  static async createManyFiles(filesData: FileCreatePayload[]): Promise<FileDocument[]> {
    const result = await FileModel.insertMany(filesData);
    return result;
  }

  /**
   * Find a file by its name and project ID
   * @param fileName - Name of the file to find
   * @param projectId - Project ID where the file belongs
   * @returns The file document if found, null otherwise
   */
  static async findFileByNameAndProject(fileName: string, projectId: string): Promise<FileDocument | null> {
    try {
      // Normalize file name to match storage pattern
      const normalizedFileName = fileName.toLowerCase().replace(/[^a-z0-9.-]/g, '-');

      // Search for files with matching name (either original or normalized) and project
      return await FileModel.findOne({
        $or: [
          { name: fileName, project: projectId },
          { name: normalizedFileName, project: projectId },
          { path: `/files/${normalizedFileName}`, project: projectId }
        ]
      });
    } catch (error) {
      Logger.error(`Find file by name error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Get a file by its ID
   * @param fileId - ID of the file to retrieve
   * @returns The file document if found, null otherwise
   */
  static async getFileById(fileId: string): Promise<FileDocument | null> {
    try {
      return await FileModel.findById(fileId);
    } catch (error) {
      Logger.error(`Get file by ID error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Get multiple files by their IDs
   * @param fileIds - Array of file IDs to retrieve
   * @returns Array of file documents
   */
  static async getFilesByIds(fileIds: string[]): Promise<FileDocument[]> {
    try {
      return await FileModel.find({ _id: { $in: fileIds } });
    } catch (error) {
      Logger.error(`Get files by IDs error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Update a file record
   * @param fileId - ID of the file to update
   * @param updateData - Data to update the file with
   * @returns The updated file document if found, null otherwise
   */
  static async updateFile(fileId: string, updateData: FileUpdatePayload): Promise<FileDocument | null> {
    try {
      return await FileModel.findByIdAndUpdate(
        fileId,
        { $set: updateData },
        { new: true }
      );
    } catch (error) {
      Logger.error(`Update file error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  static async getProjectFiles(
    projectId: string,
    options: FileQueryOptions
  ): Promise<PaginateResult<FileDocument>> {
    try {
      const { page = 1, limit = 10, search, sort = '-createdAt', type, mimeTypes } = options;

      const query: FilterQuery<FileDocument> = { project: projectId };

      if (search) {
        query.$text = { $search: search };
      }
      
      // Add filter by file type
      if (type) {
        // Different types of mime type prefixes
        const typeMap: Record<string, string> = {
          'image': 'image/',
          'video': 'video/',
          'audio': 'audio/'
        };
        
        if (typeMap[type]) {
          query.mimeType = { $regex: new RegExp(`^${typeMap[type]}`) };
        }
      }
      
      // Filter by specific mime types if provided
      if (mimeTypes && mimeTypes.length > 0) {
        query.mimeType = { $in: mimeTypes };
      }

      const paginateOptions: PaginateOptions = {
        page,
        limit,
        sort,
        lean: true
      };

      return await FileModel.paginate(query, paginateOptions);
    } catch (error) {
      Logger.error(`Get project files error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  static async deleteFiles(fileIds: string[]): Promise<number> {
    try {
      const result = await FileModel.deleteMany({ _id: { $in: fileIds } });
      return result.deletedCount || 0;
    } catch (error) {
      Logger.error(`Delete files error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  static async deleteProjectFiles(projectId: string): Promise<number> {
    try {
      const result = await FileModel.deleteMany({ project: projectId });
      return result.deletedCount || 0;
    } catch (error) {
      Logger.error(`Delete project files error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}

export default FilesService;
