import { CloudinaryUploadResponse, deleteFromCloudinary, getPublicIdFromUrl, uploadToCloudinary } from './cloudinary.lib';
import Logger from '../config/logger.config';
import { FileSystemUtil } from './fs.util';
import { appConfig } from '@halogen/common';

/**
 * Utility class for file replacement operations
 */
export class FileReplacementUtil {
  /**
   * Replace or create a file in Cloudinary with a consistent naming pattern
   *
   * @param filePath - Local path to file to be uploaded
   * @param folder - Folder within project storage (e.g. "metadata")
   * @param projectId - Project ID
   * @param staticName - Static name to use for the file (without extension)
   * @param options - Additional upload options for Cloudinary
   * @returns Cloudinary upload response
   */
  static async replaceFile(
    filePath: string,
    folder: string,
    projectId: string,
    staticName: string,
    options: Record<string, any> = {}
  ): Promise<CloudinaryUploadResponse> {
    try {
      Logger.info(`Replacing file: ${staticName} in ${projectId}/${folder}`);

      const publicId = `${appConfig.cloudinaryPath}/${projectId}/${folder}/${staticName}`;

      try {
        await deleteFromCloudinary(publicId);
        Logger.info(`Deleted existing file with public ID: ${publicId}`);
      } catch (error) {
        if (error instanceof Error && !error.message.includes('not found')) {
          Logger.warn(`Error deleting file ${publicId}: ${error.message}`);
        }
      }

      const uploadOptions = {
        ...options,
        public_id: staticName,
      };

      const uploadResult = await uploadToCloudinary(filePath, `${projectId}/${folder}`, uploadOptions);

      FileSystemUtil.deleteFile(filePath);

      return uploadResult;
    } catch (error) {
      FileSystemUtil.deleteFile(filePath);
      Logger.error(`File replacement error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Replace file using URL of existing file
   *
   * @param filePath - Local path to new file
   * @param existingFileUrl - URL of existing file to replace
   * @param options - Additional upload options for Cloudinary
   * @returns Cloudinary upload response
   */
  static async replaceFileByUrl(
    filePath: string,
    existingFileUrl: string,
    options: Record<string, any> = {}
  ): Promise<CloudinaryUploadResponse> {
    try {
      const publicId = getPublicIdFromUrl(existingFileUrl);

      if (!publicId) {
        throw new Error('Could not extract public ID from URL');
      }

      const parts = publicId.split('/');
      const filename = parts.pop() || ''; // Remove the filename
      const folder = parts.join('/').replace(`${appConfig.cloudinaryPath}/`, ''); // Remove cloudinary path prefix

      try {
        await deleteFromCloudinary(publicId);
        Logger.info(`Deleted existing file with public ID: ${publicId}`);
      } catch (error) {
        if (error instanceof Error && !error.message.includes('not found')) {
          Logger.warn(`Error deleting file ${publicId}: ${error.message}`);
        }
      }

      const uploadResult = await uploadToCloudinary(filePath, folder, {
        ...options,
        public_id: filename
      });

      FileSystemUtil.deleteFile(filePath);

      return uploadResult;
    } catch (error) {
      FileSystemUtil.deleteFile(filePath);
      Logger.error(`File replacement by URL error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}

export default FileReplacementUtil;
