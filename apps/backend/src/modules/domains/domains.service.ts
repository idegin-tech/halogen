import DomainModel, { DomainDocument } from './domains.model';
import { DomainData, DomainStatus, DomainQueryOptions, PaginatedResponse } from '@halogen/common';
import { AddDomainDTO } from './domains.dtos';
import Logger from '../../config/logger.config';
import { DomainLib } from '../../lib/domain.lib';
import { SSLManager } from '../../lib/ssl.lib';
import { DomainQueue } from '../../lib/domain-queue.lib';
import { isDomainBlacklisted } from './domain-blacklist';

export class DomainsService {    static async addDomain(projectId: string, domainData: AddDomainDTO): Promise<DomainData & { verificationToken?: string }> {
        try {
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
            
            // Generate verification token immediately
            const verificationToken = await DomainLib.generateVerificationToken(domainName, projectId);
            
            // Update domain status to PENDING_DNS
            savedDomain.status = DomainStatus.PENDING_DNS;
            await savedDomain.save();
            
            // Queue verification job
            await DomainQueue.addVerificationJob(savedDomain.toObject() as DomainData, verificationToken);
            
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
    }static async getDomainsByProject(
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
            
            const results = await DomainModel.paginate(query, paginateOptions);            return {
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
            } as DomainData;        } catch (error) {
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
            
            await DomainQueue.addVerificationJob(updatedDomain.toObject() as DomainData, verificationToken);
            
            Logger.info(`Domain verification triggered for ${domain.name}`);
            
            const domainObj = updatedDomain.toObject();
            return {
                ...domainObj,
                _id: (domainObj._id as any).toString()
            } as DomainData;        } catch (error) {
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
    }> {
        try {
            const domain = await DomainModel.findById(domainId);
            if (!domain) {
                throw new Error('Domain not found');
            }

            const jobStatus = await DomainQueue.getVerificationJobStatus(domainId);
            const isVerified = domain.status === DomainStatus.ACTIVE;
            
            // If verification is still in progress
            if (jobStatus.inProgress) {
                return {
                    domainId: (domain._id as any).toString(),
                    status: domain.status,
                    isVerified,
                    verifiedAt: domain.verifiedAt,
                    jobStatus: jobStatus.status
                };
            }
            
            // Manual verification check
            if (domain.status === DomainStatus.PENDING_DNS) {
                const verificationToken = await DomainLib.generateVerificationToken(domain.name, domain.project);
                
                const status = await DomainLib.getDomainStatus(domain.name, verificationToken);
                
                if (status.recommendedStatus !== domain.status) {
                    await this.updateDomainStatus(domainId, status.recommendedStatus);
                    domain.status = status.recommendedStatus;
                    
                    if (status.recommendedStatus === DomainStatus.ACTIVE) {
                        domain.verifiedAt = new Date().toISOString();
                    }
                }
                
                return {
                    domainId: (domain._id as any).toString(),
                    status: domain.status,
                    isVerified: domain.status === DomainStatus.ACTIVE,
                    verificationToken,
                    verifiedAt: domain.verifiedAt
                };
            }
            
            return {
                domainId: (domain._id as any).toString(),
                status: domain.status,
                isVerified,
                verifiedAt: domain.verifiedAt
            };        } catch (error) {
            Logger.error(`Check verification status error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
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

            if (domain.status !== DomainStatus.ACTIVE) {
                throw new Error('Domain must be verified before SSL certificate can be generated');
            }
            
            await DomainQueue.addSSLGenerationJob(domain.toObject() as DomainData);
            
            return {
                domainId: (domain._id as any).toString(),
                sslStatus: 'generating',
                message: 'SSL certificate generation initiated'
            };        } catch (error) {
            Logger.error(`Trigger SSL generation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async checkSSLStatus(domainId: string): Promise<{
        domainId: string;
        sslStatus: string;
        isSSLActive: boolean;
        certificateExpiry?: string;
    }> {
        try {
            const domain = await DomainModel.findById(domainId);
            if (!domain) {
                throw new Error('Domain not found');
            }

            const jobStatus = await DomainQueue.getSSLJobStatus(domainId);
            
            if (jobStatus.inProgress) {
                return {
                    domainId: (domain._id as any).toString(),
                    sslStatus: 'generating',
                    isSSLActive: false
                };
            }
            
            const certificate = await SSLManager.checkCertificate(domain.name);
            
            return {
                domainId: (domain._id as any).toString(),
                sslStatus: certificate.isValid ? 'active' : 'inactive',
                isSSLActive: certificate.isValid,
                certificateExpiry: certificate.expiryDate?.toISOString()
            };        } catch (error) {
            Logger.error(`Check SSL status error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    static async deleteDomain(domainId: string): Promise<boolean> {
        try {
            const domain = await DomainModel.findById(domainId);
            if (!domain) {
                return false;
            }
            
            // If the domain has SSL certificate, revoke it
            const certificate = await SSLManager.checkCertificate(domain.name);
            if (certificate.isValid) {
                await SSLManager.revokeCertificate(domain.name);
            }
            
            // Remove Nginx configuration if exists
            const configPath = `${process.cwd()}/nginx-configs/${domain.name}.conf`;
            const fs = require('fs-extra');
            if (await fs.pathExists(configPath)) {
                await fs.remove(configPath);
                await DomainLib.reloadNginx();
            }
            
            await DomainModel.findByIdAndDelete(domainId);
            return true;
        } catch (error) {
            Logger.error(`Delete domain error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }    static async updateDomainStatus(domainId: string, status: DomainStatus): Promise<DomainData> {
        try {
            const domain = await DomainModel.findById(domainId);
            if (!domain) {
                throw new Error('Domain not found');
            }
            
            domain.status = status;
            
            if (status === DomainStatus.ACTIVE && !domain.verifiedAt) {
                domain.verifiedAt = new Date().toISOString();
            }
            
            const updatedDomain = await domain.save();
            
            // If domain becomes active, generate Nginx config
            if (status === DomainStatus.ACTIVE) {
                try {
                    await DomainLib.generateNginxConfig({
                        domain: domain.name,
                        projectId: domain.project
                    });
                    await DomainLib.reloadNginx();
                } catch (configError) {
                    Logger.error(`Failed to generate Nginx config: ${configError instanceof Error ? configError.message : 'Unknown error'}`);
                }
            }
            
            // Notify webhook subscribers about domain status change
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
            // This is a placeholder - in a real implementation, you would fetch webhook endpoints from the database
            // and call them with the payload
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
}
