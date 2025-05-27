import { Request, Response } from 'express';
import { DomainsService } from './domains.service';
import { ResponseHelper } from '../../lib/response.helper';
import { DomainVerificationDTO, SSLCertificateDTO } from './domains.dtos';
import { DomainQueryOptions, DomainStatus } from '@halogen/common';
import Logger from '../../config/logger.config';
import { DomainQueue } from '../../lib/domain-queue.lib';
import { SSLManager } from '../../lib/ssl-manager.lib';
import DomainModel from './domains.model';
import ProjectModel from '../projects/projects.model';
import { VERIFICATION_TXT_NAME } from '../../config/constants';



export class DomainsController {
    /**
     * Add a domain to a project
     */
    static async addDomain(req: Request, res: Response): Promise<void> {
        try {
            const { projectId } = req.params;
            const domainData = req.body;

            if (!projectId) {
                ResponseHelper.error(res, 'Project ID is required', 400);
                return;
            }

            const domain = await DomainsService.addDomain(projectId, domainData);
            ResponseHelper.success(res, domain, 'Domain added successfully', 201);
        } catch (error) {
            Logger.error(`Add domain error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            ResponseHelper.error(
                res,
                error instanceof Error ? error.message : 'Failed to add domain',
                error instanceof Error && error.message.includes('already exists') ? 400 : 500
            );
        }
    }

    /**
     * Get domains by project ID
     */
    static async getDomainsByProject(req: Request, res: Response): Promise<void> {
        try {
            const { projectId } = req.params;

            if (!projectId) {
                ResponseHelper.error(res, 'Project ID is required', 400);
                return;
            }

            const queryOptions: DomainQueryOptions = {
                search: req.query.search as string,
                page: req.query.page ? parseInt(req.query.page as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                sortBy: req.query.sortBy as string,
                sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
                status: req.query.status as any,
                isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
            };

            const domains = await DomainsService.getDomainsByProject(projectId, queryOptions);
            ResponseHelper.success(res, domains, 'Domains retrieved successfully');
        } catch (error) {
            Logger.error(`Get domains error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            ResponseHelper.error(
                res,
                error instanceof Error ? error.message : 'Failed to retrieve domains',
                500
            );
        }
    }

    /**
     * Get the primary domain for a project (or null if none exists)
     */
    static async getPrimaryDomain(req: Request, res: Response): Promise<void> {
        try {
            const { projectId } = req.params;

            if (!projectId) {
                ResponseHelper.error(res, 'Project ID is required', 400);
                return;
            }

            // Query with limit 1 to get the first domain
            const result = await DomainsService.getDomainsByProject(projectId, { limit: 1 });

            // Return the first domain or null
            const primaryDomain = result.docs.length > 0 ? result.docs[0] : null;

            ResponseHelper.success(
                res,
                primaryDomain,
                primaryDomain ? 'Primary domain retrieved successfully' : 'No domains found for this project'
            );
        } catch (error) {
            Logger.error(`Get primary domain error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            ResponseHelper.error(
                res,
                error instanceof Error ? error.message : 'Failed to retrieve primary domain',
                500
            );
        }
    }

    static async getDomainById(req: Request, res: Response): Promise<void> {
        try {
            const domain = await DomainModel.findById(req.params.domainId);
            if (!domain) {
                ResponseHelper.error(res, 'Domain not found', 404);
                return;
            }

            const project = await ProjectModel.findById(domain.project, '+verificationToken name');
            
            ResponseHelper.success(res, {
                ...domain.toObject(),
                project,
                txtRecord: {
                    type: 'TXT',
                    name: VERIFICATION_TXT_NAME,
                    value: project?.verificationToken || ''
                }
            });
        } catch (error) {
            Logger.error('Error in getDomainById:', error);
            ResponseHelper.error(res, 'Error getting domain');
        }
    }

    static async triggerDomainVerification(req: Request, res: Response): Promise<void> {
        try {
            const { domainId } = req.body as DomainVerificationDTO;
            console.log(`\n\n\n`)
            Logger.info(`Triggering domain verification for domain ID: ${domainId}`);
            const result = await DomainsService.triggerDomainVerification(domainId);
            ResponseHelper.success(res, result, 'Domain verification initiated successfully');
        } catch (error) {
            console.log(`triggerDomainVerification ERROR::`, error)
            Logger.error(`Trigger domain verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            ResponseHelper.error(
                res,
                error instanceof Error ? error.message : 'Failed to trigger domain verification',
                error instanceof Error && error.message.includes('not found') ? 404 : 500
            );
        }
    }

    /**
     * Check domain verification status
     */
    static async checkVerificationStatus(req: Request, res: Response): Promise<void> {
        try {
            const { domainId } = req.params;

            if (!domainId) {
                ResponseHelper.error(res, 'Domain ID is required', 400);
                return;
            }

            const status = await DomainsService.checkVerificationStatus(domainId);
            ResponseHelper.success(res, status, 'Verification status retrieved successfully');
        } catch (error) {
            Logger.error(`Check verification status error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            ResponseHelper.error(
                res,
                error instanceof Error ? error.message : 'Failed to check verification status',
                error instanceof Error && error.message.includes('not found') ? 404 : 500
            );
        }
    }

    /**
     * Trigger SSL certificate generation
     */
    static async triggerSSLGeneration(req: Request, res: Response): Promise<void> {
        try {
            const { domainId } = req.body as SSLCertificateDTO;
            console.log('TRIGGERING SSL GENERATION FOR DOMAIN ID:', domainId);
            const result = await DomainsService.triggerSSLGeneration(domainId);
            ResponseHelper.success(res, result, 'SSL certificate generation initiated successfully');
        } catch (error) {
            console.log(error)
            Logger.error(`Trigger SSL generation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            ResponseHelper.error(
                res,
                error instanceof Error ? error.message : 'Failed to trigger SSL generation',
                error instanceof Error && error.message.includes('not found') ? 404 :
                    error instanceof Error && error.message.includes('verified') ? 400 : 500
            );
        }
    }

    /**
     * Check SSL certificate status
     */
    static async checkSSLStatus(req: Request, res: Response): Promise<void> {
        try {
            const { domainId } = req.params;

            if (!domainId) {
                ResponseHelper.error(res, 'Domain ID is required', 400);
                return;
            }

            const status = await DomainsService.checkSSLStatus(domainId);
            ResponseHelper.success(res, status, 'SSL status retrieved successfully');
        } catch (error) {
            Logger.error(`Check SSL status error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            ResponseHelper.error(
                res,
                error instanceof Error ? error.message : 'Failed to check SSL status',
                error instanceof Error && error.message.includes('not found') ? 404 : 500
            );
        }
    }
    static async deleteDomain(req: Request, res: Response): Promise<void> {
        try {
            const { domainId } = req.params;

            if (!domainId) {
                ResponseHelper.error(res, 'Domain ID is required', 400);
                return;
            }

            // First check if the domain exists
            const domain = await DomainsService.getDomainById(domainId);
            if (!domain) {
                ResponseHelper.notFound(res, 'Domain');
                return;
            }

            // Log the domain being deleted for debugging purposes
            Logger.info(`Deleting domain: ${domain.name} (ID: ${domainId}, Status: ${domain.status})`);
            
            const deleted = await DomainsService.deleteDomain(domainId);

            if (!deleted) {
                ResponseHelper.error(res, 'Failed to delete domain', 500);
                return;
            }

            ResponseHelper.success(res, { id: domainId, name: domain.name }, 'Domain deleted successfully');
        } catch (error) {
            Logger.error(`Delete domain error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            ResponseHelper.error(
                res,
                error instanceof Error ? error.message : 'Failed to delete domain',
                500
            );
        }
    }

    
    static async getDomainSystemStatus(req: Request, res: Response): Promise<void> {
        try {
            const verificationQueueCount = await DomainQueue.verificationQueue.getJobCounts();
            const sslQueueCount = await DomainQueue.sslQueue.getJobCounts();

            const fs = require('fs-extra');

            const CERTS_DIR = process.platform === 'win32'
                ? 'C:\\ssl\\certificates'
                : '/etc/halogen/certificates';
            const NGINX_DIR = `${process.cwd()}/nginx-configs`;

            const certDirExists = await fs.pathExists(CERTS_DIR);
            const nginxDirExists = await fs.pathExists(NGINX_DIR);

            const stats = {
                totalDomains: await DomainsService.getDomainCount(),
                activeDomainsCount: await DomainsService.getDomainCountByStatus(DomainStatus.ACTIVE),
                pendingDomainsCount: await DomainsService.getDomainCountByStatus(DomainStatus.PENDING),
                pendingDNSCount: await DomainsService.getDomainCountByStatus(DomainStatus.PENDING_DNS),
                failedDomainsCount: await DomainsService.getDomainCountByStatus(DomainStatus.FAILED)
            };

            let certDirPermissions = 'unknown';
            if (certDirExists) {
                try {
                    if (process.platform !== 'win32') {
                        const { stdout } = await require('util').promisify(require('child_process').exec)(`ls -ld "${CERTS_DIR}"`);
                        certDirPermissions = stdout.trim();
                    } else {
                        certDirPermissions = 'Windows permissions not checked';
                    }
                } catch (error) {
                    certDirPermissions = 'Failed to check permissions';
                }
            }

            const serverIP = process.env.SERVER_IP;

            ResponseHelper.success(res, {
                systemHealth: {
                    certificateDirectory: {
                        path: CERTS_DIR,
                        exists: certDirExists,
                        permissions: certDirPermissions
                    },
                    nginxConfigDirectory: {
                        path: NGINX_DIR,
                        exists: nginxDirExists
                    }
                },
                queueHealth: {
                    verificationQueue: verificationQueueCount,
                    sslQueue: sslQueueCount
                },
                domainStats: stats,
                serverIP
            }, 'Domain system status retrieved successfully');
        } catch (error) {
            Logger.error(`Get domain system status error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            ResponseHelper.error(
                res,
                error instanceof Error ? error.message : 'Failed to retrieve domain system status',
                500
            );
        }
    }

    /**
     * Get domain queue status with details
     */
    static async getDomainQueueStatus(req: Request, res: Response): Promise<void> {
        try {
            const verificationJobs = await DomainQueue.verificationQueue.getJobs(['active', 'waiting', 'delayed', 'failed']);
            const sslJobs = await DomainQueue.sslQueue.getJobs(['active', 'waiting', 'delayed', 'failed']);

            const verificationJobDetails = await Promise.all(verificationJobs.map(async job => {
                const state = await job.getState();
                return {
                    id: job.id,
                    domainId: job.data.domainId,
                    domainName: job.data.domainName,
                    projectId: job.data.projectId,
                    state,
                    attempts: job.attemptsMade,
                    timestamp: job.timestamp
                };
            }));

            const sslJobDetails = await Promise.all(sslJobs.map(async job => {
                const state = await job.getState();
                return {
                    id: job.id,
                    domainId: job.data.domainId,
                    domainName: job.data.domainName,
                    projectId: job.data.projectId,
                    state,
                    attempts: job.attemptsMade,
                    timestamp: job.timestamp
                };
            }));

            ResponseHelper.success(res, {
                verificationJobs: verificationJobDetails,
                sslJobs: sslJobDetails
            }, 'Queue status retrieved successfully');
        } catch (error) {
            Logger.error(`Get queue status error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            ResponseHelper.error(
                res,
                error instanceof Error ? error.message : 'Failed to retrieve queue status',
                500
            );
        }
    }

    /**
     * Get certificate statistics
     */
    static async getCertificateStats(req: Request, res: Response): Promise<void> {
        try {
            // Get domains that are active
            const domains = await DomainsService.getAllActiveDomains();

            type CertResult = {
                domainId: string;
                domainName: string;
                projectId: string;
                hasValidCert: boolean;
                certExpiry?: Date;
                certIssued?: Date;
                certPath?: string;
            };

            // Check certificates for each domain
            const certResults: CertResult[] = await Promise.all(
                domains.map(async (domain) => {
                    const certInfo = await SSLManager.checkCertificate(domain.name);
                    return {                        domainId: domain._id as string,                        domainName: domain.name,
                        projectId: domain.project,
                        hasValidCert: certInfo.isValid,
                        certExpiry: certInfo.expiryDate,
                        certIssued: domain.sslIssuedAt ? new Date(domain.sslIssuedAt) : new Date(),
                        certPath: certInfo.certPath
                    };
                })
            );

            // Group by expiry timeframes
            const now = new Date();
            const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            const expiringDomains = {
                expiredCerts: certResults.filter((cert: CertResult) => cert.hasValidCert && cert.certExpiry && cert.certExpiry < now),
                expiringWithinWeek: certResults.filter((cert: CertResult) =>
                    cert.hasValidCert && cert.certExpiry &&
                    cert.certExpiry > now && cert.certExpiry < oneWeekFromNow
                ),
                expiringWithinMonth: certResults.filter((cert: CertResult) =>
                    cert.hasValidCert && cert.certExpiry &&
                    cert.certExpiry > oneWeekFromNow && cert.certExpiry < oneMonthFromNow
                ),
                healthy: certResults.filter((cert: CertResult) =>
                    cert.hasValidCert && cert.certExpiry && cert.certExpiry > oneMonthFromNow
                ),
                invalid: certResults.filter((cert: CertResult) => !cert.hasValidCert)
            };

            ResponseHelper.success(res, {
                totalDomains: domains.length,
                totalCertificates: certResults.filter((cert: CertResult) => cert.hasValidCert).length,
                expiringDomains,
                certDetails: certResults
            }, 'Certificate statistics retrieved successfully');
        } catch (error) {
            Logger.error(`Get certificate stats error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            ResponseHelper.error(
                res,
                error instanceof Error ? error.message : 'Failed to retrieve certificate statistics',
                500
            );
        }
    }
}
