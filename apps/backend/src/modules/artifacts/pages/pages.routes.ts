import { Router } from 'express';
import { PagesController } from './pages.controller';
import { AuthMiddleware } from '../../auth/auth.middleware';
import { RequestValidation } from '../../../middleware/request.middleware';
import { syncPagesSchema } from './pages.dtos';

const router = Router();

router.use(AuthMiddleware.requireAuth);

router.post('/projects/:projectId/sync', 
  RequestValidation.validateBody(syncPagesSchema),
  PagesController.syncPages
);

export default router;
