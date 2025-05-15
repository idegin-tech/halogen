import { Router } from 'express';
import { RequestValidation } from '../../middleware/request.middleware';
import { AuthMiddleware } from '../auth/auth.middleware';
import ProjectSettingsController from './project-settings.controller';
import { updateProjectFontsSchema } from './project-settings.dto';

const router = Router();

/**
 * @route PUT /api/project-settings/:projectId/fonts
 * @desc Update project fonts
 * @access Private
 */
router.put(
  '/:projectId/fonts',
  AuthMiddleware.requireAuth,
  RequestValidation.validateBody(updateProjectFontsSchema),
  ProjectSettingsController.updateProjectFonts
);

export default router;
