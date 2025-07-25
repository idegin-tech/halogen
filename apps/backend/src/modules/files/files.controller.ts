import { Request, Response } from 'express';
import path from 'path';
import { ResponseHelper } from '../../lib/response.helper';
import { uploadToCloudinary, deleteFromCloudinary } from '../../lib/cloudinary.lib';
import { deleteLocalFile } from '../../lib/upload.lib';
import { optimizeImage } from '../../lib/image-processing.lib';
import Logger from '../../config/logger.config';
import { FilesService } from './files.service';
import { MAX_FILE_SIZE, MAX_FILES_PER_UPLOAD, SUPPORTED_FILE_TYPES, SUPPORTED_IMAGE_TYPES } from '@halogen/common';
import { FileReplacementUtil } from '../../lib/file-replacement.util';

export class FilesController {
  static async uploadFiles(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      
      if (!projectId) {
        ResponseHelper.error(res, 'Project ID is required', 400);
        return;
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        ResponseHelper.error(res, 'No files provided', 400);
        return;
      }

      if (req.files.length > MAX_FILES_PER_UPLOAD) {
        ResponseHelper.error(
          res,
          `Maximum ${MAX_FILES_PER_UPLOAD} files can be uploaded at a time`,
          400
        );
        return;
      }

      const uploadedFiles = [];
      const errors = [];
      const replacedFiles = [];

      for (const file of req.files) {
        try {
          if (file.size > MAX_FILE_SIZE) {
            errors.push({
              name: file.originalname,
              error: `File size exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
            });
            await deleteLocalFile(file.path);
            continue;
          }

          if (!SUPPORTED_FILE_TYPES.includes(file.mimetype)) {
            errors.push({
              name: file.originalname,
              error: 'File type not supported'
            });
            await deleteLocalFile(file.path);
            continue;
          }
          
          // Normalize file name to use as the static name in storage
          const normalizedFileName = file.originalname
            .toLowerCase()
            .replace(/[^a-z0-9.-]/g, '-');

          // Check if a file with this name already exists for this project
          const existingFile = await FilesService.findFileByNameAndProject(
            normalizedFileName,
            projectId
          );

          // Optimize images before upload
          let filePathToUpload = file.path;
          if (SUPPORTED_IMAGE_TYPES.includes(file.mimetype)) {
            const optimizedPath = await optimizeImage(file.path, file.originalname);
            if (optimizedPath !== file.path) {
              filePathToUpload = optimizedPath;
            }
          }
          
          const uploadOptions: Record<string, any> = {
            resource_type: file.mimetype.startsWith('image')
              ? 'image' as const
              : file.mimetype.startsWith('video')
              ? 'video' as const
              : 'raw' as const,
          };

          if (file.mimetype.startsWith('image')) {
            // Generate thumbnail
            uploadOptions.eager = [
              { width: 200, height: 200, crop: 'fill', format: 'jpg', quality: 80 }
            ];
            
            // Apply compression to the original image on Cloudinary
            if (file.mimetype.includes('jpeg') || file.mimetype.includes('jpg')) {
              uploadOptions.quality = 80;
            } else if (file.mimetype.includes('png')) {
              uploadOptions.quality = 80;
              uploadOptions.compression = 'low';
            } else if (file.mimetype.includes('webp')) {
              uploadOptions.quality = 80;
            }
          }

          let uploadResult;

          if (existingFile) {
            // If file already exists, replace it by its normalized name
            uploadResult = await FileReplacementUtil.replaceFile(
              filePathToUpload,
              'files',
              projectId,
              normalizedFileName.split('.')[0], // Remove extension for Cloudinary public_id
              uploadOptions
            );

            // @ts-ignore
            await FilesService.updateFile(existingFile._id, {
              size: file.size,
              mimeType: file.mimetype,
              downloadUrl: uploadResult.url,
              thumbnailUrl: uploadResult.thumbnail_url,
              updatedAt: new Date()
            });

            // Add to list of replaced files
            replacedFiles.push(existingFile._id);

            // @ts-ignore
            uploadedFiles.push(await FilesService.getFileById(existingFile._id));
          } else {
            // For new files, upload with normalized name
            uploadResult = await FileReplacementUtil.replaceFile(
              filePathToUpload,
              'files',
              projectId,
              normalizedFileName.split('.')[0], // Remove extension for Cloudinary public_id
              uploadOptions
            );

            const fileExtension = path.extname(file.originalname).substring(1).toLowerCase();

            // Create a new file record
            const fileEntry = await FilesService.createFile({
              project: projectId,
              path: `/files/${normalizedFileName}`,
              name: file.originalname,
              extension: fileExtension,
              mimeType: file.mimetype,
              size: file.size,
              downloadUrl: uploadResult.url,
              thumbnailUrl: uploadResult.thumbnail_url,
              user: req.user?.id || ''
            });

            uploadedFiles.push(fileEntry);
          }

          // Clean up temporary files
          deleteLocalFile(file.path);
          if (filePathToUpload !== file.path) {
            deleteLocalFile(filePathToUpload);
          }
        } catch (error) {
          Logger.error(`Error processing file ${file.originalname}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          errors.push({
            name: file.originalname,
            error: 'Failed to process file'
          });
          deleteLocalFile(file.path);
        }
      }

      ResponseHelper.success(
        res,
        { 
          files: uploadedFiles, 
          errors,
          replacedCount: replacedFiles.length,
          totalUploaded: uploadedFiles.length,
          totalErrors: errors.length
        },
        replacedFiles.length > 0
          ? `${uploadedFiles.length} files uploaded (${replacedFiles.length} replaced)`
          : 'Files uploaded successfully'
      );
    } catch (error) {
      Logger.error(`File upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      ResponseHelper.error(
        res,
        error instanceof Error ? error.message : 'Failed to upload files',
        500
      );
    }
  }

  static async getProjectFiles(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { page, limit, search, sort, type, mimeTypes } = req.query;
      
      if (!projectId) {
        ResponseHelper.error(res, 'Project ID is required', 400);
        return;
      }

      const files = await FilesService.getProjectFiles(projectId, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search ? String(search) : undefined,
        sort: sort ? String(sort) : undefined,
        type: type ? String(type) : undefined,
        mimeTypes: mimeTypes ? (Array.isArray(mimeTypes) 
          ? mimeTypes.map(String) 
          : String(mimeTypes).split(','))
          : undefined
      });

      ResponseHelper.success(res, files, 'Files retrieved successfully');
    } catch (error) {
      Logger.error(`Get files error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      ResponseHelper.error(
        res,
        error instanceof Error ? error.message : 'Failed to retrieve files',
        500
      );
    }
  }

  static async deleteFiles(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const { fileIds } = req.body;
      
      if (!projectId) {
        ResponseHelper.error(res, 'Project ID is required', 400);
        return;
      }

      if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        ResponseHelper.error(res, 'File IDs are required', 400);
        return;
      }

      const files = await FilesService.getFilesByIds(fileIds);
      
      const invalidFiles = files.filter(file => file.project !== projectId);
      if (invalidFiles.length > 0) {
        ResponseHelper.error(res, 'Some file IDs do not belong to this project', 403);
        return;
      }

      const deletePromises = files.map(async (file) => {
        const urlParts = file.downloadUrl.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1];
        const publicIdParts = publicIdWithExt.split('.');
        const publicId = `${projectId}/files/${publicIdParts[0]}`;
        
        try {
          await deleteFromCloudinary(publicId);
          return true;
        } catch (error) {
          Logger.error(`Failed to delete file from Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return false;
        }
      });

      await Promise.all(deletePromises);

      const deletedCount = await FilesService.deleteFiles(fileIds);

      ResponseHelper.success(
        res, 
        { 
          deletedCount,
          fileIds 
        }, 
        'Files deleted successfully'
      );
    } catch (error) {
      Logger.error(`Delete files error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      ResponseHelper.error(
        res,
        error instanceof Error ? error.message : 'Failed to delete files',
        500
      );
    }
  }
}
