import { Router } from 'express';
import { VariablesController } from './variables.controller';
import { AuthMiddleware } from '../../auth/auth.middleware';
import { RequestValidation } from '../../../middleware/request.middleware';
import { syncVariablesSchema } from './variables.dtos';

const router = Router();

router.use(AuthMiddleware.requireAuth);

router.post('/projects/:projectId/sync', 
  RequestValidation.validateBody(syncVariablesSchema),
  VariablesController.syncVariables
);

export default router;
