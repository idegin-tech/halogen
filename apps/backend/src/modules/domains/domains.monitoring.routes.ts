import { Router } from 'express';
import { DomainsController } from './domains.controller';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware';

const router = Router();

// Base routes require admin authentication
router.use(requireAuth);
router.use(requireAdmin);

// Domain system monitoring endpoints
router.get('/system-status', DomainsController.getDomainSystemStatus);
router.get('/queue-status', DomainsController.getDomainQueueStatus);
router.get('/certificate-stats', DomainsController.getCertificateStats);

export default router;
