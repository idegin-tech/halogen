import { Router } from 'express';
import { UploadsController } from './uploads.controller';
import { FilesController } from '../files/files.controller';
import { upload } from '../../lib/upload.lib';
import { AuthMiddleware } from '../auth/auth.middleware';
import { RequestValidation } from '../../middleware/request.middleware';
import { fileQuerySchema, fileDeleteSchema,  } from '../files/files.dtos';
import { MAX_FILES_PER_UPLOAD } from '@halogen/common';

const router = Router();

router.use(AuthMiddleware.requireAuth);

router.post(
  '/project/:projectId/favicon',
  upload.single('file'),
  UploadsController.uploadFavicon
);

router.delete(
  '/project/:projectId/favicon',
  UploadsController.deleteFavicon
);

router.post(
  '/project/:projectId/og-image',
  upload.single('file'),
  UploadsController.uploadOpenGraphImage
);

router.delete(
  '/project/:projectId/og-image',
  UploadsController.deleteOpenGraphImage
);

router.post(
  '/project/:projectId/files',
  AuthMiddleware.requireProjectAccess,
  upload.array('files', MAX_FILES_PER_UPLOAD),
  FilesController.uploadFiles
);

router.get(
  '/project/:projectId/files',
  AuthMiddleware.requireProjectAccess,
  RequestValidation.validateQuery(fileQuerySchema),
  FilesController.getProjectFiles
);

router.delete(
  '/project/:projectId/files',
  AuthMiddleware.requireProjectAccess,
  RequestValidation.validateBody(fileDeleteSchema),
  FilesController.deleteFiles
);

router.post(
  '/file',
  upload.single('file'),
  UploadsController.uploadFile
);

export default router;
