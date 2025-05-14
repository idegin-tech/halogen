import { Router } from 'express';
import { UploadsController } from './uploads.controller';
import { upload } from '../../lib/upload.lib';
import { AuthMiddleware } from '../auth/auth.middleware';

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
  '/file',
  upload.single('file'),
  UploadsController.uploadFile
);

export default router;
