import { Router } from 'express';
import { DomainsController } from './domains.controller';
import { AuthMiddleware } from '../auth/auth.middleware';
import { RequestValidation } from '../../middleware/request.middleware';
import { 
    addDomainSchema, 
    domainVerificationSchema, 
    sslCertificateSchema,
    domainsQuerySchema 
} from './domains.dtos';
import { domainRateLimiter, projectDomainLimitMiddleware } from './domains.middleware';

const router = Router();

router.use(AuthMiddleware.requireAuth);

router.use(domainRateLimiter);

router.post(
    '/:projectId',
    AuthMiddleware.requireProjectAccess,
    RequestValidation.validateBody(addDomainSchema),
    projectDomainLimitMiddleware,
    DomainsController.addDomain
);


router.get(
    '/:projectId',
    AuthMiddleware.requireProjectAccess,
    RequestValidation.validateQuery(domainsQuerySchema),
    DomainsController.getDomainsByProject
);

router.get(
    '/primary/:projectId',
    AuthMiddleware.requireProjectAccess,
    DomainsController.getPrimaryDomain
);

router.get(
    '/domain/:domainId',
    DomainsController.getDomainById
);

router.post(
    '/verify',
    RequestValidation.validateBody(domainVerificationSchema),
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

export default router;
