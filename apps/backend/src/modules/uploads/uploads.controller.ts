import { Request, Response } from 'express';
import path from 'path';
import { ResponseHelper } from '../../lib/response.helper';
import { uploadToCloudinary, deleteFromCloudinary } from '../../lib/cloudinary.lib';
import { deleteLocalFile } from '../../lib/upload.lib';
import { processFavicon, processOpenGraphImage, cleanupTempFile } from '../../lib/image-processing.lib';
import Logger from '../../config/logger.config';
import { ProjectMetadataService } from '../project-metadata';
import { FileReplacementUtil } from '../../lib/file-replacement.util';
import { appConfig } from '@halogen/common';

export class UploadsController {
  /**
   * Upload favicon image, process it, and store in Cloudinary
   * @param req - Express request with file
   * @param res - Express response
   */
  static async uploadFavicon(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        ResponseHelper.error(res, 'No file provided', 400);
        return;
      }

      const { projectId } = req.params;

      if (!projectId) {
        ResponseHelper.error(res, 'Project ID is required', 400);
        return;
      }

      const uploadedFile = req.file;
      const filePath = uploadedFile.path;

      try {
        const processedPath = await processFavicon(filePath);
        
        const uploadResult = await FileReplacementUtil.replaceFile(
          processedPath,
          'metadata',
          projectId,
          'favicon',
          { transformation: [{ width: 32, height: 32, crop: 'fill' }] }
        );

        deleteLocalFile(filePath);

        await ProjectMetadataService.updateProjectMetadataByProjectId(projectId, {
          favicon: uploadResult.url
        });

        ResponseHelper.success(res, {
          url: uploadResult.url,
          filename: path.basename(uploadResult.url)
        }, 'Favicon uploaded successfully');
      } catch (error) {
        deleteLocalFile(filePath);
        throw error;
      }
    } catch (error) {
      Logger.error(`Favicon upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      ResponseHelper.error(
        res,
        error instanceof Error ? error.message : 'Failed to upload favicon',
        500
      );
    }
  }

  /**
   * Upload Open Graph image, process it, and store in Cloudinary
   * @param req - Express request with file
   * @param res - Express response
   */
  static async uploadOpenGraphImage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        ResponseHelper.error(res, 'No file provided', 400);
        return;
      }

      const { projectId } = req.params;

      if (!projectId) {
        ResponseHelper.error(res, 'Project ID is required', 400);
        return;
      }

      const uploadedFile = req.file;
      const filePath = uploadedFile.path;

      try {
        // Process the OG image (resize to recommended dimensions)
        const processedPath = await processOpenGraphImage(filePath);
        
        // Use static name 'og-image' for consistent replacement
        const uploadResult = await FileReplacementUtil.replaceFile(
          processedPath,
          'metadata',
          projectId,
          'og-image',
          { transformation: [{ width: 1200, height: 630, crop: 'limit' }] }
        );

        // Original file cleanup
        deleteLocalFile(filePath);

        // Update the project metadata with the new OG image URL
        await ProjectMetadataService.updateProjectMetadataByProjectId(projectId, {
          ogImage: uploadResult.url
        });

        ResponseHelper.success(res, {
          url: uploadResult.url,
          filename: path.basename(uploadResult.url)
        }, 'Open Graph image uploaded successfully');
      } catch (error) {
        // Ensure cleanup even on error
        deleteLocalFile(filePath);
        throw error;
      }
    } catch (error) {
      Logger.error(`OG image upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      ResponseHelper.error(
        res,
        error instanceof Error ? error.message : 'Failed to upload Open Graph image',
        500
      );
    }
  }

  /**
   * Generic file upload handler for testing
   * @param req - Express request with file
   * @param res - Express response
   */
  static async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        ResponseHelper.error(res, 'No file provided', 400);
        return;
      }

      const uploadedFile = req.file;

      ResponseHelper.success(res, {
        originalname: uploadedFile.originalname,
        filename: uploadedFile.filename,
        path: uploadedFile.path,
        size: uploadedFile.size,
        mimetype: uploadedFile.mimetype
      }, 'File uploaded successfully');
    } catch (error) {
      Logger.error(`File upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      ResponseHelper.error(
        res,
        error instanceof Error ? error.message : 'Failed to upload file',
        500
      );
    }
  }

  /**
   * Delete favicon image from Cloudinary and update project metadata
   * @param req - Express request
   * @param res - Express response
   */
  static async deleteFavicon(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      if (!projectId) {
        ResponseHelper.error(res, 'Project ID is required', 400);
        return;
      }

      // Get current project metadata
      const metadata = await ProjectMetadataService.getProjectMetadataByProjectId(projectId);
      
      if (!metadata || !metadata.favicon) {
        ResponseHelper.error(res, 'No favicon found for this project', 404);
        return;
      }

      // Use fixed public ID pattern for favicon
      const publicId = `${appConfig.cloudinaryPath}/${projectId}/metadata/favicon`;

      // Delete from Cloudinary
      await deleteFromCloudinary(publicId);

      // Update project metadata
      await ProjectMetadataService.updateProjectMetadataByProjectId(projectId, {
        favicon: ''
      });

      ResponseHelper.success(res, { projectId }, 'Favicon deleted successfully');
    } catch (error) {
      Logger.error(`Favicon delete error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      ResponseHelper.error(
        res,
        error instanceof Error ? error.message : 'Failed to delete favicon',
        500
      );
    }
  }

  /**
   * Delete Open Graph image from Cloudinary and update project metadata
   * @param req - Express request
   * @param res - Express response
   */
  static async deleteOpenGraphImage(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;

      if (!projectId) {
        ResponseHelper.error(res, 'Project ID is required', 400);
        return;
      }

      // Get current project metadata
      const metadata = await ProjectMetadataService.getProjectMetadataByProjectId(projectId);
      
      if (!metadata || !metadata.ogImage) {
        ResponseHelper.error(res, 'No Open Graph image found for this project', 404);
        return;
      }

      // Use fixed public ID pattern for OG image
      const publicId = `${appConfig.cloudinaryPath}/${projectId}/metadata/og-image`;

      // Delete from Cloudinary
      await deleteFromCloudinary(publicId);

      // Update project metadata
      await ProjectMetadataService.updateProjectMetadataByProjectId(projectId, {
        ogImage: ''
      });

      ResponseHelper.success(res, { projectId }, 'Open Graph image deleted successfully');
    } catch (error) {
      Logger.error(`OG image delete error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      ResponseHelper.error(
        res,
        error instanceof Error ? error.message : 'Failed to delete Open Graph image',
        500
      );
    }
  }
}
