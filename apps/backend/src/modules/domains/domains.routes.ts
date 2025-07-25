import { Router } from 'express';
import { DomainsController } from './domains.controller';
import { RequestValidation } from '../../middleware/request.middleware';
import { 
    domainsQuerySchema, 
    domainCheckSchema,
    sslCertificateSchema
} from './domains.dtos';
import { domainRateLimiter } from './domains.middleware';

const router = Router();

router.use(domainRateLimiter);


router.get(
    '/:projectId',
    RequestValidation.validateQuery(domainsQuerySchema),
    DomainsController.getDomainsByProject
);
router.get(
    '/primary/:projectId',
    DomainsController.getPrimaryDomain
);
router.get(
    '/domain/:domainId',
    DomainsController.getDomainById
);
router.post(
    '/check',
    RequestValidation.validateBody(domainCheckSchema),
    DomainsController.triggerDomainVerification
);
router.get(
    '/verify/:domainId',
    DomainsController.checkVerificationStatus
);
router.post(
    '/ssl',
    RequestValidation.validateBody(sslCertificateSchema),
    DomainsController.triggerSSLGeneration
);
router.get(
    '/ssl/:domainId',
    DomainsController.checkSSLStatus
);
router.delete(
    '/domain/:domainId',
    DomainsController.deleteDomain
);
router.get('/domains-status', DomainsController.getDomainSystemStatus);

router.post(
    '/new/:projectId',
    DomainsController.addDomain
);

export default router;
