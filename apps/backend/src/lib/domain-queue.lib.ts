import Queue from 'bull';
import { DomainData, DomainStatus } from '@halogen/common';
import { DomainLib } from './domain.lib';
import { SSLManager } from './ssl-manager.lib';
import { SudoApiClient } from './sudo-api.client';
import Logger from '../config/logger.config';
import { isProd, validateEnv } from '../config/env.config';

const env = validateEnv();
const REDIS_URL = env.REDIS_URL || 'redis://localhost:6379';

interface DomainVerificationJob {
  domainId: string;
  domainName: string;
  projectId: string;
  verificationToken: string;
}

interface SSLGenerationJob {
  domainId: string;
  domainName: string;
  projectId: string;
}

export class DomainQueue {
  public static verificationQueue = new Queue<DomainVerificationJob>('domain-verification', REDIS_URL);
  public static sslQueue = new Queue<SSLGenerationJob>('ssl-generation', REDIS_URL);
  private static initialized = false;
  
  static initialize(domainsService: any): void {
    if (this.initialized) {
      return;
    }
    
    Logger.info('[DOMAIN_QUEUE] Initializing domain queue system');
    
    // Configure verification queue processor
    this.verificationQueue.process(async (job) => {
      try {
        Logger.info(`[DOMAIN_QUEUE] Processing verification job for ${job.data.domainName}`);
        const { domainId, domainName, projectId, verificationToken } = job.data;
        const retryCount = job.attemptsMade;
        
        Logger.info(`[DOMAIN_QUEUE] Verification attempt ${retryCount + 1} for ${domainName}`);
        Logger.info(`[DOMAIN_QUEUE] Verification token: ${verificationToken}`);
        
        // Check domain verification status
        const status = await DomainLib.getDomainStatus(domainName, verificationToken);
        
        Logger.info(`[DOMAIN_QUEUE] Domain status: propagated=${status.propagated}, verified=${status.verified}, recommendedStatus=${status.recommendedStatus}`);
        
        if (status.verified) {
          Logger.info(`[DOMAIN_QUEUE] Domain ${domainName} verification successful`);
          
          // First generate Nginx config before marking domain as active
          if (isProd) {
            try {
              const configOptions = {
                domain: domainName,
                projectId
              };
              
              Logger.info(`[DOMAIN_QUEUE] Generating Nginx config for ${domainName} before updating status`);
              await DomainLib.generateNginxConfig(configOptions);
              Logger.info(`[DOMAIN_QUEUE] Initial Nginx config created for ${domainName}`);
              
              // Reload Nginx to apply the configuration
              const reloadSuccess = await DomainLib.reloadNginx();
              if (reloadSuccess) {
                Logger.info(`[DOMAIN_QUEUE] Nginx reloaded successfully for ${domainName}`);
              } else {
                Logger.error(`[DOMAIN_QUEUE] Failed to reload Nginx for ${domainName}`);
              }
            } catch (configError) {
              Logger.error(`[DOMAIN_QUEUE] Error creating Nginx config for ${domainName}: ${configError instanceof Error ? configError.message : 'Unknown error'}`);
              // Continue with verification process even if config creation fails
              // We'll retry config creation later
            }
          }
          
          // Now update domain status to active
          await domainsService.updateDomainStatus(domainId, DomainStatus.ACTIVE);
          await domainsService.updateDomainVerificationAttempt(domainId, `Attempt ${retryCount + 1}: Verification successful!`);
          
          // Only add SSL generation job if we're in production and Nginx config was successful
          if (isProd) {
            try {
              Logger.info(`[DOMAIN_QUEUE] Adding SSL generation job for ${domainName}`);
              await this.addSSLGenerationJob({
                _id: domainId,
                name: domainName,
                project: projectId
              } as DomainData);
              
              Logger.info(`[DOMAIN_QUEUE] SSL generation job queued for ${domainName}`);
            } catch (error) {
              Logger.error(`[DOMAIN_QUEUE] Error creating SSL generation job for ${domainName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        } else if (status.propagated) {
          Logger.info(`[DOMAIN_QUEUE] Domain ${domainName} DNS propagated but not verified`);
          await domainsService.updateDomainStatus(domainId, DomainStatus.PROPAGATING);
          
          if (retryCount < 5) {
            Logger.info(`[DOMAIN_QUEUE] Will retry verification for ${domainName} (attempt ${retryCount + 1}/5)`);
            await domainsService.updateDomainVerificationAttempt(domainId, `Attempt ${retryCount + 1}: DNS propagated, waiting for verification record`);
            
            throw new Error('Domain not yet verified, will retry');
          } else {
            Logger.warn(`[DOMAIN_QUEUE] Domain verification failed after ${retryCount + 1} attempts for ${domainName}`);
            await domainsService.updateDomainStatus(domainId, DomainStatus.FAILED);
          }
        } else {
          Logger.info(`[DOMAIN_QUEUE] Domain ${domainName} DNS not yet propagated`);
          await domainsService.updateDomainStatus(domainId, DomainStatus.PENDING_DNS);
          
          if (retryCount < 5) {
            Logger.info(`[DOMAIN_QUEUE] Will retry verification for ${domainName} (attempt ${retryCount + 1}/5)`);
            await domainsService.updateDomainVerificationAttempt(domainId, `Attempt ${retryCount + 1}: Waiting for DNS propagation`);
            
            throw new Error('Domain DNS not yet propagated, will retry');
          } else {
            Logger.warn(`[DOMAIN_QUEUE] Domain verification failed after ${retryCount + 1} attempts for ${domainName}`);
            await domainsService.updateDomainStatus(domainId, DomainStatus.FAILED);
          }
        }
        
        return { success: status.recommendedStatus === DomainStatus.ACTIVE };
      } catch (error) {
        Logger.error(`[DOMAIN_QUEUE] Error in domain verification job: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    });
    
    // Configure SSL generation queue processor
    this.sslQueue.process(async (job) => {
      try {
        Logger.info(`[SSL_QUEUE] Processing SSL generation job for ${job.data.domainName}`);
        const { domainId, domainName, projectId } = job.data;
        
        // Check if the domain is verified and propagated before generating SSL
        const status = await DomainLib.getDomainStatus(domainName);
        
        if (!status.verified || !status.propagated) {
          Logger.error(`[SSL_QUEUE] Domain ${domainName} is not verified or propagated. Skipping SSL generation.`);
          await domainsService.updateDomainSSLStatus(domainId, 'FAILED', null);
          return;
        }
        
        Logger.info(`[SSL_QUEUE] Domain ${domainName} is verified and propagated. Proceeding with SSL generation.`);
        
        // Generate SSL certificate through the Sudo API
        try {
          Logger.info(`[SSL_QUEUE] Requesting SSL certificate for ${domainName} via Sudo API`);
          
          // Use the new SSLManager
          const certificate = await SSLManager.requestCertificate(domainName, projectId);
          
          if (!certificate.isValid) {
            Logger.error(`[SSL_QUEUE] Failed to generate SSL certificate for ${domainName}`);
            await domainsService.updateDomainSSLStatus(domainId, 'FAILED', null);
            return;
          }
          
          Logger.info(`[SSL_QUEUE] SSL certificate for ${domainName} generated successfully`);
          
          await domainsService.updateDomainSSLStatus(
            domainId, 
            'ACTIVE', 
            certificate.expiryDate
          );
          
          // Generate updated Nginx config with SSL
          try {
            Logger.info(`[SSL_QUEUE] Updating Nginx configuration with SSL for ${domainName}`);
            await DomainLib.generateNginxConfig({
              domain: domainName,
              projectId,
              sslCertPath: certificate.certPath,
              sslKeyPath: certificate.keyPath
            });
            
            const reloadSuccess = await DomainLib.reloadNginx();
            
            if (reloadSuccess) {
              Logger.info(`[SSL_QUEUE] Nginx reloaded successfully with SSL config for ${domainName}`);
              await domainsService.updateDomainStatus(domainId, DomainStatus.ACTIVE);
            } else {
              Logger.error(`[SSL_QUEUE] Failed to reload Nginx with SSL config for ${domainName}`);
              // Don't fail the job, certificate is still valid
            }
          } catch (configError) {
            Logger.error(`[SSL_QUEUE] Error updating Nginx config with SSL for ${domainName}: ${configError instanceof Error ? configError.message : 'Unknown error'}`);
            // Don't fail the job, certificate is still valid
          }
          
          return { success: certificate.isValid, certificate };
        } catch (error) {
          Logger.error(`[SSL_QUEUE] Error generating SSL certificate for ${domainName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          await domainsService.updateDomainSSLStatus(domainId, 'FAILED', null);
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      } catch (error) {
        Logger.error(`[SSL_QUEUE] Error in SSL generation job for ${job.data.domainName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });
    
    this.initialized = true;
    Logger.info('Domain queue initialized');
  }
  static async addVerificationJob(domain: DomainData, verificationToken: string): Promise<void> {
    // Make sure we have a clean job queue for this domain
    const existingJobs = await this.verificationQueue.getJobs(['active', 'waiting', 'delayed']);
    const domainJobs = existingJobs.filter(j => j.data.domainId === domain._id);
    
    // Remove any existing jobs for this domain
    for (const job of domainJobs) {
      await job.remove();
      Logger.info(`Removed existing verification job for domain ${domain.name}`);
    }
    
    // Add the new job with the verification token
    await this.verificationQueue.add({
      domainId: domain._id as string,
      domainName: domain.name,
      projectId: domain.project,
      verificationToken
    }, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 60000 // 1 minute
      },
      removeOnComplete: true,
      removeOnFail: false
    });
    
    Logger.info(`Added new verification job for domain ${domain.name}`);
  }
  static async addSSLGenerationJob(domain: DomainData): Promise<void> {
    // Make sure we have a clean job queue for this domain
    const existingJobs = await this.sslQueue.getJobs(['active', 'waiting', 'delayed']);
    const domainJobs = existingJobs.filter(j => j.data.domainId === domain._id);
    
    // Remove any existing jobs for this domain
    for (const job of domainJobs) {
      await job.remove();
      Logger.info(`Removed existing SSL job for domain ${domain.name}`);
    }
    
    // Add the new job
    await this.sslQueue.add({
      domainId: domain._id as string,
      domainName: domain.name,
      projectId: domain.project
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000 // 1 minute
      },
      removeOnComplete: true,
      removeOnFail: false
    });
    
    Logger.info(`Added new SSL job for domain ${domain.name}`);
  }
  static async getVerificationJobStatus(domainId: string): Promise<{
    inProgress: boolean;
    attempts: number;
    status: string;
  }> {
    const jobs = await this.verificationQueue.getJobs(['active', 'waiting', 'delayed']);
    const job = jobs.find(j => j.data.domainId === domainId);
    
    if (!job) {
      return {
        inProgress: false,
        attempts: 0,
        status: 'not_found'
      };
    }
    
    const state = await job.getState();
    return {
      inProgress: true,
      attempts: job.attemptsMade,
      status: state
    };
  }

  static async getSSLJobStatus(domainId: string): Promise<{
    inProgress: boolean;
    attempts: number;
    status: string;
  }> {
    const jobs = await this.sslQueue.getJobs(['active', 'waiting', 'delayed']);
    const job = jobs.find(j => j.data.domainId === domainId);
    
    if (!job) {
      return {
        inProgress: false,
        attempts: 0,
        status: 'not_found'
      };
    }
    
    const state = await job.getState();
    return {
      inProgress: true,
      attempts: job.attemptsMade,
      status: state
    };
  }  static async removeJobs(domainId: string): Promise<void> {
    try {
      // Clean up verification jobs
      const verificationJobs = await this.verificationQueue.getJobs(['active', 'waiting', 'delayed']);
      const domainVerificationJobs = verificationJobs.filter(j => j.data.domainId === domainId);
      
      for (const job of domainVerificationJobs) {
        await job.remove();
        Logger.info(`Removed verification job for domain ID ${domainId}`);
      }
      
      // Clean up SSL jobs
      const sslJobs = await this.sslQueue.getJobs(['active', 'waiting', 'delayed']);
      const domainSslJobs = sslJobs.filter(j => j.data.domainId === domainId);
      
      for (const job of domainSslJobs) {
        await job.remove();
        Logger.info(`Removed SSL job for domain ID ${domainId}`);
      }
    } catch (error) {
      Logger.error(`Error removing jobs for domain ${domainId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Continue with deletion even if job cleanup fails
    }
  }
}
