import Queue from 'bull';
import { DomainData, DomainStatus } from '@halogen/common';
import Logger from '../config/logger.config';
import { DomainLib } from './domain.lib';
import { SSLManager } from './ssl.lib';
import { validateEnv } from '../config/env.config';

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
    if (this.initialized) return;
    
    this.verificationQueue.process(async (job) => {
      try {
        Logger.info(`Processing domain verification job for ${job.data.domainName}`);
        const { domainId, domainName, projectId, verificationToken } = job.data;
        
        const status = await DomainLib.getDomainStatus(domainName, verificationToken);
        
        await domainsService.updateDomainStatus(domainId, status.recommendedStatus);
        
        if (status.recommendedStatus !== DomainStatus.ACTIVE) {
          const retryCount = job.attemptsMade;
          
          if (retryCount < 3) {
            throw new Error('Domain not yet verified, will retry');
          } else {
            Logger.warn(`Domain verification failed after ${retryCount} attempts for ${domainName}`);
            await domainsService.updateDomainStatus(domainId, DomainStatus.FAILED);
          }
        } else {
          Logger.info(`Domain ${domainName} verified successfully`);
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
        
        const certificate = await SSLManager.requestCertificate(domainName, projectId);
        
        if (!certificate.isValid) {
          const retryCount = job.attemptsMade;
          
          if (retryCount < 3) {
            throw new Error('SSL generation failed, will retry');
          } else {
            Logger.warn(`SSL generation failed after ${retryCount} attempts for ${domainName}`);
            await domainsService.updateDomainStatus(domainId, DomainStatus.FAILED);
          }
        } else {
          Logger.info(`SSL certificate for ${domainName} generated successfully`);
          
          const configOptions = {
            domain: domainName,
            projectId,
            sslCertPath: certificate.certPath,
            sslKeyPath: certificate.keyPath
          };
          
          await DomainLib.generateNginxConfig(configOptions);
          await DomainLib.reloadNginx();
        }
        
        return { success: certificate.isValid, certificate };
      } catch (error) {
        Logger.error(`Error in SSL generation job: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
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
