import { Router } from 'express';
import { FilesController } from './files.controller';
import { upload } from '../../lib/upload.lib';
import { RequestValidation } from '../../middleware/request.middleware';
import { AuthMiddleware } from '../auth/auth.middleware';
import { fileQuerySchema, fileDeleteSchema } from './files.dtos';
import { MAX_FILES_PER_UPLOAD } from '@halogen/common';

const router = Router();

router.use(AuthMiddleware.requireAuth);

router.post(
  '/:projectId',
  AuthMiddleware.requireProjectAccess,
  upload.array('files', MAX_FILES_PER_UPLOAD),
  FilesController.uploadFiles
);

router.get(
  '/:projectId',
  AuthMiddleware.requireProjectAccess,
  RequestValidation.validateQuery(fileQuerySchema),
  FilesController.getProjectFiles
);

router.delete(
  '/:projectId',
  AuthMiddleware.requireProjectAccess,
  RequestValidation.validateBody(fileDeleteSchema),
  FilesController.deleteFiles
);

export default router;
