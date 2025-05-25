
import Queue from 'bull';
import { DomainData, DomainStatus } from '@halogen/common';
import { DomainLib } from './domain.lib';
import { SSLManager } from './ssl.lib';
import Logger from '../config/logger.config';
import { validateEnv } from '../config/env.config';
import PrivilegedCommandUtil from './privileged-command.util';

const env = validateEnv();
const REDIS_URL = env.REDIS_URL || 'redis://localhost:6379';

// Import environment check utilities
import { isProduction, shouldRunProductionOperations } from '../config/env.config';

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
  public static sslQueue = new Queue<SSLGenerationJob>('ssl-generation', REDIS_URL);  private static initialized = false;
  
  static initialize(domainsService: any): void {    if (this.initialized) return;
    
    // Skip queue processing in non-production environments
    if (!isProduction()) {
      Logger.info('Skipping domain queue initialization in non-production environment');
      this.initialized = true;
      return;
    }
    
    this.verificationQueue.process(async (job) => {
      try {
        Logger.info(`Processing domain verification job for ${job.data.domainName}`);
        const { domainId, domainName, projectId, verificationToken } = job.data;
        
        // Get domain status (checks DNS propagation and verification)
        const status = await DomainLib.getDomainStatus(domainName, verificationToken);
        
        // Update domain status in the database
        await domainsService.updateDomainStatus(domainId, status.recommendedStatus);
        
        if (status.recommendedStatus !== DomainStatus.ACTIVE) {
          const retryCount = job.attemptsMade;
          
          if (retryCount < 5) {
            // Log the verification attempt
            Logger.info(`Domain verification attempt ${retryCount + 1} for ${domainName}`);
            await domainsService.updateDomainVerificationAttempt(domainId, `Attempt ${retryCount + 1}: ${status.propagated ? 'DNS propagated' : 'DNS not propagated'}, ${status.verified ? 'Ownership verified' : 'Ownership not verified'}`);
            
            throw new Error('Domain not yet verified, will retry');
          } else {
            Logger.warn(`Domain verification failed after ${retryCount} attempts for ${domainName}`);
            await domainsService.updateDomainStatus(domainId, DomainStatus.FAILED);
          }
        } else {
          Logger.info(`Domain ${domainName} verified successfully`);
            // If the domain is verified and we're in production, create initial Nginx config
          if (shouldRunProductionOperations()) {
            try {
              // Create initial Nginx config without SSL
              const configOptions = {
                domain: domainName,
                projectId
              };
              
              await DomainLib.generateNginxConfig(configOptions);
              Logger.info(`Initial Nginx config created for ${domainName}`);
              
              // Queue SSL certificate generation automatically
              await this.addSSLGenerationJob({
                _id: domainId,
                name: domainName,
                project: projectId
              } as DomainData);
              
              Logger.info(`SSL generation job queued for ${domainName}`);
            } catch (error) {
              Logger.error(`Error creating initial Nginx config for ${domainName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
        
        return { success: status.recommendedStatus === DomainStatus.ACTIVE };
      } catch (error) {
        Logger.error(`Error in domain verification job: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    });
    
    this.sslQueue.process(async (job) => {
      try {
        Logger.info(`Processing SSL generation job for ${job.data.domainName}`);
        const { domainId, domainName, projectId } = job.data;
        
        // Request certificate using Certbot in production or ACME client in development
        const certificate = await SSLManager.requestCertificate(domainName, projectId);
        
        if (!certificate.isValid) {
          const retryCount = job.attemptsMade;
          
          if (retryCount < 3) {
            Logger.info(`SSL generation attempt ${retryCount + 1} failed for ${domainName}, will retry`);
            throw new Error('SSL generation failed, will retry');
          } else {
            Logger.warn(`SSL generation failed after ${retryCount} attempts for ${domainName}`);
            await domainsService.updateDomainSSLStatus(domainId, 'FAILED', null);
          }
        } else {
          Logger.info(`SSL certificate for ${domainName} generated successfully`);
          
          // Update domain with SSL certificate information
          await domainsService.updateDomainSSLStatus(
            domainId, 
            'ACTIVE', 
            certificate.expiryDate
          );
          
          // Generate Nginx config with SSL
          const configOptions = {
            domain: domainName,
            projectId,
            sslCertPath: certificate.certPath,
            sslKeyPath: certificate.keyPath
          };
          
          await DomainLib.generateNginxConfig(configOptions);
          const reloadSuccess = await DomainLib.reloadNginx();
          
          if (reloadSuccess) {
            Logger.info(`Nginx reloaded successfully with SSL config for ${domainName}`);
            
            // Update domain status to ACTIVE
            await domainsService.updateDomainStatus(domainId, DomainStatus.ACTIVE);
          } else {
            Logger.error(`Failed to reload Nginx with SSL config for ${domainName}`);
          }
        }
        
        return { success: certificate.isValid, certificate };
      } catch (error) {
        Logger.error(`Error in SSL generation job: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    });
    
    // Initialize required utilities
    PrivilegedCommandUtil.initialize().catch(error => {
      Logger.error(`Failed to initialize privileged command utility: ${error instanceof Error ? error.message : 'Unknown error'}`);
    });
    
    this.initialized = true;
    Logger.info('Domain queue initialized');
  }

  static async addVerificationJob(domain: DomainData, verificationToken: string): Promise<void> {
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
  }

  static async addSSLGenerationJob(domain: DomainData): Promise<void> {
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
  }
}
