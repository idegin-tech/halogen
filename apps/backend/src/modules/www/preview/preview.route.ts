import { Router } from 'express';
import { PreviewController } from './preview.controller';

const router = Router();

// Public routes - no auth middleware required
router.get('/projects/subdomain/:subdomain', PreviewController.getProjectDataBySubdomain);
router.get('/projects/subdomain/:subdomain/layout-variables', PreviewController.getProjectVariablesForLayout);

export default router;