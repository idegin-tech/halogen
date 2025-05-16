import { Request, Response } from 'express';
import path from 'path';
import { ResponseHelper } from '../../lib/response.helper';
import { uploadToCloudinary, deleteFromCloudinary } from '../../lib/cloudinary.lib';
import { deleteLocalFile } from '../../lib/upload.lib';
import Logger from '../../config/logger.config';
import { FilesService } from './files.service';
import { MAX_FILE_SIZE, MAX_FILES_PER_UPLOAD, SUPPORTED_FILE_TYPES } from '@halogen/common';

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
          }          // Configure upload options based on file type
          const uploadOptions: Record<string, any> = {
            resource_type: file.mimetype.startsWith('image')
              ? 'image' as const
              : file.mimetype.startsWith('video')
              ? 'video' as const
              : 'raw' as const,
          };
          
          // For images, ensure we generate a thumbnail
          if (file.mimetype.startsWith('image')) {
            uploadOptions.eager = [
              { width: 200, height: 200, crop: 'fill', format: 'jpg', quality: 80 }
            ];
          }
          
          const uploadResult = await uploadToCloudinary(
            file.path,
            `${projectId}/files`,
            uploadOptions
          );

          const fileExtension = path.extname(file.originalname).substring(1).toLowerCase();
            const fileEntry = await FilesService.createFile({
            project: projectId,
            path: `/files/${file.originalname}`,
            name: file.originalname,
            extension: fileExtension,
            mimeType: file.mimetype,
            size: file.size,
            downloadUrl: uploadResult.secure_url || uploadResult.url,
            thumbnailUrl: uploadResult.thumbnail_url,
            user: req.user?.id || ''
          });

          uploadedFiles.push(fileEntry);

          await deleteLocalFile(file.path);
        } catch (error) {
          Logger.error(`Error processing file ${file.originalname}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          errors.push({
            name: file.originalname,
            error: 'Failed to process file'
          });
          await deleteLocalFile(file.path);
        }
      }

      ResponseHelper.success(
        res,
        { 
          files: uploadedFiles, 
          errors,
          totalUploaded: uploadedFiles.length,
          totalErrors: errors.length
        },
        'Files uploaded successfully'
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
