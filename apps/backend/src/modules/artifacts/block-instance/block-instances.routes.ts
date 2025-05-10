import { Router } from 'express';
import { BlockInstancesController } from './block-instances.controller';
import { AuthMiddleware } from '../../auth/auth.middleware';
import { RequestValidation } from '../../../middleware/request.middleware';
import { syncBlocksSchema } from './block-instances.dtos';

const router = Router();

router.use(AuthMiddleware.requireAuth);

router.post('/projects/:projectId/sync', 
  RequestValidation.validateBody(syncBlocksSchema),
  BlockInstancesController.syncBlockInstances
);

export default router;
