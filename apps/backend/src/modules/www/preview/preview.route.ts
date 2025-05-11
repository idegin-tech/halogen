import { Router } from 'express';
import { PreviewController } from './preview.controller';

const router = Router();

// Public route - no auth middleware required
router.get('/projects/subdomain/:subdomain', PreviewController.getProjectDataBySubdomain);

export default router;