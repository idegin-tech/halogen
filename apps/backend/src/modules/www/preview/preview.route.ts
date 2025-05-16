import { Router } from 'express';
import { PreviewController } from './preview.controller';

const router = Router();

router.get('/projects/subdomain/:subdomain', PreviewController.getProjectDataBySubdomain);

export default router;