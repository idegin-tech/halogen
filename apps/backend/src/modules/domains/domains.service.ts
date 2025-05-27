import DomainModel from './domains.model';
import { DomainData, DomainStatus, DomainQueryOptions, PaginatedResponse } from '@halogen/common';
import Logger from '../../config/logger.config';
import { DomainLib } from '../../lib/domain.lib';
import { SSLManager } from '../../lib/ssl-manager.lib';
import { SudoApiClient } from '../../lib/sudo-api.client';
import { DomainQueue } from '../../lib/domain-queue.lib';
import { isDomainBlacklisted } from './domain-blacklist';
import validateEnv, { isProd } from '../../config/env.config';
import ProjectModel from '../projects/projects.model';

export class DomainsService {
    static async addDomain(projectId: string, domainData: { name: string }): Promise<DomainData & { verificationToken?: string }> {
        try {
            console.log('\n\n\nADDING DOMAIN:::', { domainData, projectId });
            const domainName = domainData.name.toLowerCase();

            if (isDomainBlacklisted(domainName)) {
                throw new Error('This domain is not allowed for registration');
            }

            const existingDomain = await DomainModel.findOne({ name: domainName });
            if (existingDomain) {
                throw new Error('Domain name already exists');
            }

            const existingProjectDomain = await DomainModel.findOne({
                name: domainName,
                project: projectId
            });
            if (existingProjectDomain) {
                throw new Error('Domain already exists for this project');
            }

            const newDomain = new DomainModel({
                name: domainName,
                project: projectId,
                status: DomainStatus.PENDING,
                isActive: true
            });

            const savedDomain = await newDomain.save();

            const verificationToken = await DomainLib.generateVerificationToken(domainName, projectId);

            savedDomain.status = DomainStatus.PENDING_DNS;
            await savedDomain.save();

            if (isProd) {
                await DomainQueue.addVerificationJob(savedDomain.toObject() as DomainData, verificationToken);
                Logger.info(`Domain verification job queued for ${domainName} in production environment`);
            } else {
                Logger.info(`Domain verification job skipped for ${domainName} - not in production environment`);
            }

            const domainObj = savedDomain.toObject();
            return {
                ...domainObj,
                _id: (domainObj._id as any).toString(),
                verificationToken
            } as DomainData & { verificationToken: string };
        } catch (error) {
            Logger.error(`Add domain error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async getDomainsByProject(
        projectId: string,
        options: DomainQueryOptions = {}
    ): Promise<PaginatedResponse<DomainData>> {
        try {
            const {
                search,
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                status,
                isActive
            } = options;

            const query: any = { project: projectId };

            if (search) {
                query.name = { $regex: search, $options: 'i' };
            }

            if (status) {
                if (Array.isArray(status)) {
                    query.status = { $in: status };
                } else {
                    query.status = status;
                }
            }

            if (isActive !== undefined) {
                query.isActive = isActive;
            }

            const sort: any = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

            const paginateOptions = {
                page: Number(page),
                limit: Number(limit),
                sort,
                lean: true
            };

            const results = await DomainModel.paginate(query, paginateOptions); return {
                docs: results.docs.map(domain => ({
                    ...domain,
                    _id: (domain._id as any)?.toString() || domain._id
                })) as DomainData[],
                totalDocs: results.totalDocs,
                limit: results.limit,
                totalPages: results.totalPages,
                page: results.page as any,
                pagingCounter: results.pagingCounter,
                hasPrevPage: results.hasPrevPage,
                hasNextPage: results.hasNextPage,
                prevPage: results.prevPage as any,
                nextPage: results.nextPage as any
            };
        } catch (error) {
            Logger.error(`Get domains by project error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async getDomainById(domainId: string): Promise<DomainData | null> {
        try {
            const domain = await DomainModel.findById(domainId).lean();
            if (!domain) return null;

            return {
                ...domain,
                _id: (domain._id as any)?.toString() || domain._id
            } as DomainData;
        } catch (error) {
            Logger.error(`Get domain by ID error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async triggerDomainVerification(domainId: string): Promise<DomainData> {
        try {
            const domain = await DomainModel.findById(domainId);
            if (!domain) {
                throw new Error('Domain not found');
            }

            console.log('triggerDomainVerification :::', domain)

            const verificationToken = await DomainLib.generateVerificationToken(domain.name, domain.project);

            domain.status = DomainStatus.PENDING_DNS;
            const updatedDomain = await domain.save();

            if (isProd) {
                await DomainQueue.addVerificationJob(updatedDomain.toObject() as DomainData, verificationToken);
                Logger.info(`Domain verification triggered for ${domain.name} in production environment`);
            } else {
                Logger.info(`Domain verification skipped for ${domain.name} - not in production environment`);
            }

            const domainObj = updatedDomain.toObject();
            return {
                ...domainObj,
                _id: (domainObj._id as any).toString()
            } as DomainData;
        } catch (error) {
            console.log(error)
            Logger.error(`Trigger domain verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }


    static async checkVerificationStatus(domainId: string): Promise<{
        domainId: string;
        status: DomainStatus;
        isVerified: boolean;
        verificationToken?: string;
        verifiedAt?: string;
        jobStatus?: string;
        isProduction?: boolean;
    }> {
        const domain = await DomainModel.findById(domainId);
        if (!domain) {
            throw new Error('Domain not found');
        }

        const project = await ProjectModel.findById(domain.project);
        if (!project) {
            throw new Error('Project not found');
        }

        if (!project.verificationToken) {
            Logger.error(`Project ${project._id} has no verification token`);
            throw new Error('Project verification token not found');
        }

        const expectedTxtRecord = project.verificationToken;
        const txtRecords = await DomainLib.getDomainTxtRecords(domain.name);

        const isVerified = txtRecords.some(records =>
            records.some(record => record.trim() === expectedTxtRecord.trim())
        );

        if (isVerified && !domain.verifiedAt) {
            domain.verifiedAt = new Date().toISOString();
            domain.status = DomainStatus.ACTIVE;
            await domain.save();
        }

        return {
            domainId: `${domain?._id?.toString()}`,
            status: domain.status as DomainStatus,
            isVerified,
            verificationToken: expectedTxtRecord,
            verifiedAt: domain.verifiedAt?.toString(),
            isProduction: isProd
        };
    }

    static async triggerSSLGeneration(domainId: string): Promise<{
        domainId: string;
        sslStatus: string;
        message: string;
    }> {
        try {
            const domain = await DomainModel.findById(domainId);
            if (!domain) {
                throw new Error('Domain not found');
            }

            console.log('DOMAIN WAS FOUND:::', domain)

            if (domain.status !== DomainStatus.ACTIVE) {
                throw new Error('Domain must be verified before SSL certificate can be generated');
            }

            if (isProd) {
                await DomainQueue.addSSLGenerationJob(domain.toObject() as DomainData);
                Logger.info(`SSL generation job queued for ${domain.name} in production environment`);

                return {
                    domainId: (domain._id as any).toString(),
                    sslStatus: 'generating',
                    message: 'SSL certificate generation initiated',
                };
            } else {
                Logger.info(`SSL generation skipped for ${domain.name} - not in production environment`);

                return {
                    domainId: (domain._id as any).toString(),
                    sslStatus: 'active',
                    message: 'SSL certificate generation simulated in development environment',
                };
            }
        } catch (error) {
            console.log(error)
            Logger.error(`Trigger SSL generation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async checkSSLStatus(domainId: string): Promise<{
        domainId: string;
        sslStatus: string;
        isSSLActive: boolean;
        certificateExpiry?: string;
        isProduction?: boolean;
    }> {
        try {
            const domain = await DomainModel.findById(domainId);
            if (!domain) {
                throw new Error('Domain not found');
            }

            if (isProd) {
                const jobStatus = await DomainQueue.getSSLJobStatus(domainId);

                if (jobStatus.inProgress) {
                    return {
                        domainId: (domain._id as any).toString(),
                        sslStatus: 'generating',
                        isSSLActive: false,
                        isProduction: true
                    };
                } try {
                    // Use SSL Manager to check status (which uses Python API)
                    const certificate = await SSLManager.checkCertificate(domain.name);

                    return {
                        domainId: (domain._id as any).toString(),
                        sslStatus: certificate.isValid ? 'active' : 'inactive',
                        isSSLActive: certificate.isValid,
                        certificateExpiry: certificate.expiryDate?.toISOString(),
                        isProduction: true
                    };
                } catch (error) {
                    Logger.error(`SSL status check failed via Python API for ${domain.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    // Fallback to SSLManager
                    const certificate = await SSLManager.checkCertificate(domain.name);

                    return {
                        domainId: (domain._id as any).toString(),
                        sslStatus: certificate.isValid ? 'active' : 'inactive',
                        isSSLActive: certificate.isValid,
                        certificateExpiry: certificate.expiryDate?.toISOString(),
                        isProduction: true
                    };
                }
            } else {
                Logger.info(`SSL status check skipped for ${domain.name} - not in production environment`);

                const mockExpiryDate = new Date();
                mockExpiryDate.setFullYear(mockExpiryDate.getFullYear() + 1); // Certificate valid for one year

                return {
                    domainId: (domain._id as any).toString(),
                    sslStatus: 'active',
                    isSSLActive: true,
                    certificateExpiry: mockExpiryDate.toISOString(),
                    isProduction: false
                };
            }
        } catch (error) {
            Logger.error(`Check SSL status error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }



    static async deleteDomain(domainId: string): Promise<boolean> {
        try {
            const domain = await DomainModel.findById(domainId);
            if (!domain) {
                Logger.warn(`Attempted to delete non-existent domain with ID: ${domainId}`);
                return false;
            }

            Logger.info(`Starting deletion process for domain ${domain.name} (ID: ${domainId})`);

            // Clean up any queued jobs first
            await DomainQueue.removeJobs(domainId);
            Logger.info(`Removed queued jobs for domain ${domain.name}`); if (isProd) {
                // Only in production, clean up Nginx and SSL via Python API
                Logger.info(`Running production cleanup for domain ${domain.name}`); try {
                    // Use DomainLib to clean up the domain (which uses Python API)
                    const cleanupResult = await DomainLib.cleanupDomain(domain.name, domain.project as string);

                    if (cleanupResult) {
                        Logger.info(`Domain cleanup completed successfully for ${domain.name} via Python API`);
                    } else {
                        Logger.error(`Domain cleanup failed for ${domain.name}`);
                        // Continue with deletion even if cleanup fails
                    }
                } catch (cleanupError) {
                    Logger.error(`Error during domain cleanup for ${domain.name}: ${cleanupError instanceof Error ? cleanupError.message : 'Unknown error'}`);

                    // Fallback to individual cleanup operations
                    try {
                        Logger.info(`Removing Nginx configuration for ${domain.name}`);
                        await DomainLib.removeNginxConfig(domain.name);
                        Logger.info(`Nginx configuration removed for ${domain.name}`);
                    } catch (nginxError) {
                        Logger.error(`Error removing Nginx config for ${domain.name}: ${nginxError instanceof Error ? nginxError.message : 'Unknown error'}`);
                    }

                    try {
                        Logger.info(`Checking for SSL certificate for ${domain.name}`);
                        const certificate = await SSLManager.checkCertificate(domain.name);
                        if (certificate.isValid) {
                            Logger.info(`Valid SSL certificate found for ${domain.name}, revoking...`);
                            await SSLManager.revokeCertificate(domain.name);
                            Logger.info(`SSL certificate revoked for ${domain.name}`);
                        } else {
                            Logger.info(`No valid SSL certificate found for ${domain.name}`);
                        }
                    } catch (sslError) {
                        Logger.error(`Error checking/revoking SSL certificate for ${domain.name}: ${sslError instanceof Error ? sslError.message : 'Unknown error'}`);
                    }
                }
            } else {
                // In development, just log what would happen in production
                Logger.info(`Domain deletion simulated for ${domain.name} - not in production environment`);
                Logger.info(`Would revoke SSL and remove Nginx config for ${domain.name} in production`);
            }

            // Always delete the domain from the database
            await DomainModel.findByIdAndDelete(domainId);
            Logger.info(`Domain ${domain.name} successfully deleted from database`);

            // Notify webhooks about domain deletion
            this.notifyWebhooks(domain.project, {
                event: 'domain.deleted',
                data: {
                    domainId: domain?._id?.toString(),
                    domain: domain.name,
                    projectId: domain.project
                }
            }).catch(err =>
                Logger.error(`Webhook notification error: ${err instanceof Error ? err.message : 'Unknown error'}`)
            );

            return true;
        } catch (error) {
            Logger.error(`Delete domain error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }


    static async updateDomainStatus(domainId: string, status: DomainStatus): Promise<DomainData> {
        try {
            const domain = await DomainModel.findById(domainId);
            if (!domain) {
                throw new Error('Domain not found');
            }

            domain.status = status;

            if (status === DomainStatus.ACTIVE && !domain.verifiedAt) {
                domain.verifiedAt = new Date().toISOString();
            }            const updatedDomain = await domain.save();           
            
            if (status === DomainStatus.ACTIVE) {
                if (isProd) {
                    try {
                        const env = validateEnv();
                        
                        const setupResult = await SudoApiClient.setupDomain({
                            domain: domain.name,
                            project_id: domain.project,
                            ssl_enabled: true,
                            email: env.ADMIN_EMAIL
                        });

                        if (setupResult.success) {
                            Logger.info(`Domain setup completed for ${domain.name} via Python API`);
                        } else {
                            Logger.error(`Domain setup failed for ${domain.name}: ${setupResult.message}`);
                            
                            await DomainLib.generateNginxConfig({
                                domain: domain.name,
                                projectId: domain.project
                            });
                            await DomainLib.reloadNginx();
                            Logger.info(`Nginx configuration generated for ${domain.name} via fallback`);
                        }
                    } catch (setupError) {
                        Logger.error(`Error setting up domain ${domain.name}: ${setupError instanceof Error ? setupError.message : 'Unknown error'}`);
                        
                        try {
                            await DomainLib.generateNginxConfig({
                                domain: domain.name,
                                projectId: domain.project
                            });
                            await DomainLib.reloadNginx();
                            Logger.info(`Nginx configuration generated for ${domain.name} via fallback`);
                        } catch (configError) {
                            Logger.error(`Failed to generate Nginx config: ${configError instanceof Error ? configError.message : 'Unknown error'}`);
                        }
                    }
                } else {
                    Logger.info(`Nginx configuration generation skipped for ${domain.name} - not in production environment`);
                }
            }

            this.notifyWebhooks(domain.project, {
                event: 'domain.status_changed',
                data: {
                    domainId: domain?._id?.toString(),
                    domain: domain.name,
                    status,
                    projectId: domain.project
                }
            }).catch(err =>
                Logger.error(`Webhook notification error: ${err instanceof Error ? err.message : 'Unknown error'}`)
            );

            const domainObj = updatedDomain.toObject();
            return {
                ...domainObj,
                _id: (domainObj._id as any).toString()
            } as DomainData;
        } catch (error) {
            Logger.error(`Update domain status error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    private static async notifyWebhooks(projectId: string, payload: any): Promise<void> {
        try {
            Logger.info(`Notifying webhooks for project ${projectId}: ${JSON.stringify(payload)}`);
        } catch (error) {
            Logger.error(`Webhook notification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    static async getDomainCount(): Promise<number> {
        try {
            return await DomainModel.countDocuments();
        } catch (error) {
            Logger.error(`Get domain count error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async getDomainCountByStatus(status: DomainStatus): Promise<number> {
        try {
            return await DomainModel.countDocuments({ status });
        } catch (error) {
            Logger.error(`Get domain count by status error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async getAllActiveDomains(): Promise<DomainData[]> {
        try {
            const domains = await DomainModel.find({
                status: DomainStatus.ACTIVE,
                isActive: true
            }).lean();

            return domains.map(domain => ({
                ...domain,
                _id: (domain._id as any)?.toString() || domain._id
            })) as DomainData[];
        } catch (error) {
            Logger.error(`Get all active domains error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Update domain verification attempt information
     * @param domainId Domain ID
     * @param reason Verification failure reason or message
     * @returns Updated domain data
     */
    static async updateDomainVerificationAttempt(domainId: string, reason: string): Promise<DomainData> {
        try {
            const domain = await DomainModel.findByIdAndUpdate(
                domainId,
                {
                    lastVerificationAttempt: new Date(),
                    verificationFailReason: reason
                },
                { new: true }
            );

            if (!domain) {
                throw new Error('Domain not found');
            }

            return domain.toObject() as DomainData;
        } catch (error) {
            Logger.error(`Update domain verification attempt error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Update domain SSL certificate status
     * @param domainId Domain ID
     * @param status SSL status (ACTIVE, FAILED, etc.)
     * @param expiryDate Certificate expiry date
     * @returns Updated domain data
     */
    static async updateDomainSSLStatus(domainId: string, status: string, expiryDate: Date | null): Promise<DomainData> {
        try {
            const updateData: any = {
                sslIssuedAt: status === 'ACTIVE' ? new Date() : null
            };

            if (expiryDate) {
                updateData.sslExpiresAt = expiryDate;
            }

            const domain = await DomainModel.findByIdAndUpdate(
                domainId,
                updateData,
                { new: true }
            );

            if (!domain) {
                throw new Error('Domain not found');
            }

            return domain.toObject() as DomainData;
        } catch (error) {
            Logger.error(`Update domain SSL status error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
}
