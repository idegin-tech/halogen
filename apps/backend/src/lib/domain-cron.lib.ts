import { CronJob } from 'cron';
import { SSLManager, CertificateInfo } from '../lib/ssl.lib';
import { DomainStatus } from '@halogen/common';
import { DomainsService } from '../modules/domains/domains.service';
import { DomainQueue } from '../lib/domain-queue.lib';
import { DomainLib } from '../lib/domain.lib';
import Logger from '../config/logger.config';
import PrivilegedCommandUtil from './privileged-command.util';

export class DomainCronJobs {
    private static renewalJob: CronJob;
    private static verificationRetryJob: CronJob;
    private static domainHealthCheckJob: CronJob;
    private static initialized = false;

    static initialize(): void {
        if (this.initialized) return;

        // Run SSL certificate renewal check daily at 2 AM
        this.renewalJob = new CronJob('0 2 * * *', async () => {
            try {
                Logger.info('Running SSL certificate renewal check');
                await this.checkAndRenewCertificates();
            } catch (error) {
                Logger.error(`SSL renewal job error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });

        // Run verification retry job every 4 hours for failed domains
        this.verificationRetryJob = new CronJob('0 */4 * * *', async () => {
            try {
                Logger.info('Running domain verification retry job');
                await this.retryFailedDomainVerifications();
            } catch (error) {
                Logger.error(`Verification retry job error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });

        // Run domain health check every 6 hours
        this.domainHealthCheckJob = new CronJob('0 */6 * * *', async () => {
            try {
                Logger.info('Running domain health check');
                await this.monitorDomainHealth();
            } catch (error) {
                Logger.error(`Domain health check error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });

        this.renewalJob.start();
        this.verificationRetryJob.start();
        this.domainHealthCheckJob.start();
        this.initialized = true;

        Logger.info('Domain cron jobs initialized');
    }

    /**
     * Creates a new file with improved renewal functionality
     */
    private static async checkAndRenewCertificates(): Promise<void> {
        const DomainModel = require('../modules/domains/domains.model').default;
        const env = require('../config/env.config').validateEnv();
        const IS_PRODUCTION = env.NODE_ENV === 'production';

        // Find domains with active status
        const activeDomains = await DomainModel.find({
            status: DomainStatus.ACTIVE,
            isActive: true
        }).lean();

        if (!activeDomains.length) {
            Logger.info('No active domains found for SSL renewal check');
            return;
        }

        Logger.info(`Checking ${activeDomains.length} domains for SSL renewal`);

        // In production, use Certbot for renewal
        if (IS_PRODUCTION) {
            try {
                // Create and execute a script to renew all certificates using Certbot
                const renewScript = `#!/bin/bash
# Run Certbot renewal for all certificates
certbot renew --non-interactive --quiet

# Check the exit code
if [ $? -eq 0 ]; then
  echo "Certificates renewed successfully"
  
  # Reload Nginx to apply changes
  nginx -t && nginx -s reload
else
  echo "Certificate renewal failed"
  exit 1
fi
`;
                
                const result = await PrivilegedCommandUtil.createAndExecuteScript(
                    'renew-certificates.sh',
                    renewScript
                );
                
                if (result.success) {
                    Logger.info('Certificates renewed successfully using Certbot');
                    
                    // Update renewal dates in database
                    for (const domain of activeDomains) {
                        try {
                            const certificate = await SSLManager.checkCertificate(domain.name);
                            
                            if (certificate.isValid && certificate.expiryDate) {
                                await DomainModel.findByIdAndUpdate(domain._id, {
                                    sslIssuedAt: certificate.issuedDate || new Date(),
                                    sslExpiresAt: certificate.expiryDate
                                });
                                
                                Logger.info(`Updated certificate dates for ${domain.name}`);
                            }
                        } catch (error) {
                            Logger.error(`Error updating certificate dates for ${domain.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        }
                    }
                } else {
                    Logger.error(`Certbot renewal failed: ${result.stderr}`);
                    
                    // Fall back to checking individual domains
                    await this.checkIndividualDomainsForRenewal(activeDomains);
                }
            } catch (error) {
                Logger.error(`Error running Certbot renewal: ${error instanceof Error ? error.message : 'Unknown error'}`);
                
                // Fall back to checking individual domains
                await this.checkIndividualDomainsForRenewal(activeDomains);
            }
        } else {
            // Development mode - check individual domains
            await this.checkIndividualDomainsForRenewal(activeDomains);
        }
    }
    
    /**
     * Check individual domains for certificate renewal
     * Used as a fallback or in development environments
     */
    private static async checkIndividualDomainsForRenewal(domains: any[]): Promise<void> {
        const DomainModel = require('../modules/domains/domains.model').default;
        const renewalThreshold = 14; // Renew certificates 14 days before expiry
        const now = new Date();
        
        for (const domain of domains) {
            try {
                const certificate = await SSLManager.checkCertificate(domain.name);

                if (!certificate.isValid) {
                    Logger.warn(`Certificate for ${domain.name} is invalid or missing, generating new one`);
                    await DomainQueue.addSSLGenerationJob(domain);
                    continue;
                }

                if (!certificate.expiryDate) {
                    continue;
                }

                const daysUntilExpiry = Math.floor((certificate.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiry <= renewalThreshold) {
                    Logger.info(`Certificate for ${domain.name} expires in ${daysUntilExpiry} days, renewing`);
                    await DomainQueue.addSSLGenerationJob(domain);

                    // Update domain with new certificate dates
                    await DomainModel.findByIdAndUpdate(domain._id, {
                        sslIssuedAt: new Date(),
                        sslExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
                    });
                }
            } catch (error) {
                Logger.error(`Error checking certificate for ${domain.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }

    private static async retryFailedDomainVerifications(): Promise<void> {
        const DomainModel = require('../modules/domains/domains.model').default;

        // Find domains that failed verification
        const failedDomains = await DomainModel.find({
            status: DomainStatus.FAILED,
            isActive: true
        }).lean();

        if (!failedDomains.length) {
            return;
        }

        Logger.info(`Retrying verification for ${failedDomains.length} failed domains`);

        for (const domain of failedDomains) {
            try {
                const verificationToken = await DomainLib.generateVerificationToken(domain.name, domain.project);

                // Check if domain is now verifiable
                const status = await DomainLib.getDomainStatus(domain.name, verificationToken);

                if (status.recommendedStatus !== DomainStatus.FAILED) {
                    Logger.info(`Domain ${domain.name} is now verifiable, updating status to ${status.recommendedStatus}`);

                    await DomainsService.updateDomainStatus(domain._id.toString(), status.recommendedStatus);

                    if (status.recommendedStatus === DomainStatus.ACTIVE) {
                        // If domain is now active, generate SSL certificate
                        await DomainQueue.addSSLGenerationJob(domain);
                    }
                }
            } catch (error) {
                Logger.error(`Error retrying verification for ${domain.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }

    static async getDomainSystemStats(): Promise<any> {
        const DomainModel = require('../modules/domains/domains.model').default;
        
        try {
            // Get counts of domains by status
            const statusCounts = await DomainModel.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]);
            
            // Get domains with SSL certificates
            const activeDomains = await DomainModel.find({
                status: DomainStatus.ACTIVE,
                isActive: true
            }).lean();
            
            // Get SSL certificate stats
            const certificates: CertificateInfo[] = [];
            let validCerts = 0;
            let expiringSoonCerts = 0;
            
            const now = new Date();
            const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            for (const domain of activeDomains) {
                try {
                    const certificate = await SSLManager.checkCertificate(domain.name);
                    certificates.push(certificate);
                    
                    if (certificate.isValid) {
                        validCerts++;
                        
                        if (certificate.expiryDate && certificate.expiryDate < sevenDaysFromNow) {
                            expiringSoonCerts++;
                        }
                    }
                } catch (error) {
                    Logger.error(`Error checking certificate for ${domain.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            
            // Get queue status
            const verificationQueueCounts = await DomainQueue.verificationQueue.getJobCounts();
            const sslQueueCounts = await DomainQueue.sslQueue.getJobCounts();
            
            return {
                domainsByStatus: statusCounts.reduce((acc: any, curr: any) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                totalDomains: await DomainModel.countDocuments(),
                activeDomains: activeDomains.length,
                sslStats: {
                    validCertificates: validCerts,
                    expiringSoonCertificates: expiringSoonCerts,
                    totalCertificates: certificates.length
                },
                queueStatus: {
                    verification: verificationQueueCounts,
                    ssl: sslQueueCounts
                },
                lastRun: new Date().toISOString()
            };
        } catch (error) {
            Logger.error(`Error getting domain system stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
    
    static async monitorDomainHealth(): Promise<void> {
        const DomainModel = require('../modules/domains/domains.model').default;
        
        try {
            Logger.info('Starting domain health monitoring');
            
            // Find domains to check
            const domains = await DomainModel.find({
                isActive: true
            }).lean();
            
            let fixed = 0;
            
            for (const domain of domains) {
                // Check if Nginx config exists for active domains
                if (domain.status === DomainStatus.ACTIVE) {
                    try {
                        const fs = require('fs-extra');
                        const configExists = await fs.pathExists(`${process.cwd()}/nginx-configs/${domain.name}.conf`);
                        
                        if (!configExists) {
                            Logger.warn(`Nginx config missing for ${domain.name}, regenerating`);
                            
                            // Regenerate Nginx config
                            await DomainLib.generateNginxConfig({
                                domain: domain.name,
                                projectId: domain.project
                            });
                            
                            await DomainLib.reloadNginx();
                            fixed++;
                        }
                        
                        // For active domains, check if SSL is valid
                        const certificate = await SSLManager.checkCertificate(domain.name);
                        
                        if (!certificate.isValid) {
                            Logger.warn(`SSL certificate invalid for ${domain.name}, requesting new certificate`);
                            await DomainQueue.addSSLGenerationJob(domain);
                        }
                    } catch (error) {
                        Logger.error(`Error checking domain health for ${domain.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }
            }
            
            Logger.info(`Domain health monitoring complete, fixed ${fixed} domains`);
        } catch (error) {
            Logger.error(`Domain health monitoring error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
}
