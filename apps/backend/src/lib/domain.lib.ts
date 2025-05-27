import { isProd, validateEnv } from '../config/env.config';
import fs from 'fs-extra';
import path from 'path';
import Logger from '../config/logger.config';
import { DomainStatus } from '@halogen/common';
import { SudoApiClient } from './sudo-api.client';

const env = validateEnv();

const NGINX_TEMPLATES_DIR = process.platform === 'win32'
  ? path.join(process.cwd(), 'nginx-templates')
  : '/home/msuser/nginx-templates';
const NGINX_CONFIG_DIR = process.platform === 'win32'
  ? path.join(process.cwd(), 'nginx-configs')
  : '/home/msuser/nginx-configs';

const VERIFICATION_TXT_NAME = 'halogen-domain-verification';

export interface DomainInfo {
  name: string;
  project: string;
  txtRecords?: string[][];
  isVerified?: boolean;
  ipAddress?: string;
}

export interface NginxConfigOptions {
  domain: string;
  projectId: string;
  sslCertPath?: string;
  sslKeyPath?: string;
}

export class DomainLib {  /**
   * Initialize the domain library
   * Creates necessary directories and checks API health
   */
  static async initialize(): Promise<void> {
    try {
      if (!isProd) {
        Logger.info('Skipping domain library initialization in non-production environment');
        return;
      }

      Logger.info('Initializing domain library');
      
      // Ensure Nginx templates directory exists
      await fs.ensureDir(NGINX_TEMPLATES_DIR);
      Logger.info(`Ensured ${NGINX_TEMPLATES_DIR} directory exists`);
      
      // Ensure Nginx configs directory exists
      await fs.ensureDir(NGINX_CONFIG_DIR);
      Logger.info(`Ensured ${NGINX_CONFIG_DIR} directory exists`);
      
      // Check if Python API is healthy
      const healthCheck = await SudoApiClient.healthCheck();
      
      if (!healthCheck.success) {
        Logger.warn('Domain library initialization - Python API health check failed');
      } else {
        Logger.info('Domain library initialized - Python API is healthy');
      }
    } catch (error) {
      Logger.error(`Error initializing domain library: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async generateVerificationToken(domain: string, projectId: string): Promise<string> {
    try {
      const ProjectModel = require('../modules/projects/projects.model').default;
      
      const project = await ProjectModel.findById(projectId, { verificationToken: 1, verificationTokenUpdatedAt: 1 });
      
      if (project && project.verificationToken) {
        Logger.info(`Using existing verification token for project ${projectId}`);
        return project.verificationToken;
      }
      
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const token = `${VERIFICATION_TXT_NAME}=${projectId}-${timestamp}-${randomString}`;
      
      if (project) {
        project.verificationToken = token;
        project.verificationTokenUpdatedAt = new Date();
        await project.save();
        Logger.info(`Generated new verification token for project ${projectId}`);
      }
      
      return token;
    } catch (error) {
      Logger.error(`Error generating verification token: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      return `${VERIFICATION_TXT_NAME}=${projectId}-${timestamp}-${randomString}`;
    }
  }

  static async checkDNSPropagation(domain: string): Promise<boolean> {
    try {
      const response = await SudoApiClient.getDomainStatus(domain);
      
      if (response.success && response.data) {
        return response.data.propagated || false;
      }
      
      return false;
    } catch (error) {
      Logger.error(`Error checking DNS propagation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  static async verifyDomainOwnership(domain: string, expectedToken: string): Promise<boolean> {
    try {
      Logger.info(`Verifying domain ownership for ${domain} via Sudo API`);
      
      const result = await SudoApiClient.verifyDomainOwnership(domain, expectedToken);
      
      if (!result.success) {
        Logger.info(`Domain ownership verification failed for ${domain}: ${result.message}`);
        return false;
      }
      
      Logger.info(`Domain ownership verified for ${domain}`);
      return true;
    } catch (error) {
      Logger.error(`Error verifying domain ownership: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  static async generateNginxConfig(options: NginxConfigOptions): Promise<string> {
    try {
      Logger.info(`Generating Nginx config for ${options.domain} via Sudo API`);
      
      const result = await SudoApiClient.deployNginxConfig({
        domain: options.domain,
        project_id: options.projectId,
        ssl_enabled: !!options.sslCertPath && !!options.sslKeyPath
      });
      
      if (!result.success) {
        throw new Error(`Failed to generate Nginx config: ${result.message}`);
      }
      
      Logger.info(`Nginx config generated successfully for ${options.domain}`);
      return options.domain;
    } catch (error) {
      Logger.error(`Error generating Nginx config: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
  
  static async removeNginxConfig(domain: string): Promise<boolean> {
    try {
      Logger.info(`Removing Nginx config for ${domain} via Sudo API`);
      
      const result = await SudoApiClient.removeNginxConfig({
        domain,
        project_id: 'cleanup' 
      });
      
      if (!result.success) {
        throw new Error(`Failed to remove Nginx config: ${result.message}`);
      }
      
      Logger.info(`Nginx config removed successfully for ${domain}`);
      return true;
    } catch (error) {
      Logger.error(`Error removing Nginx config: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }
  
  static async reloadNginx(): Promise<boolean> {
    try {
      Logger.info('Reloading Nginx via Sudo API');
      
      const result = await SudoApiClient.reloadNginx();
      
      if (!result.success) {
        throw new Error(`Failed to reload Nginx: ${result.message}`);
      }
      
      Logger.info('Nginx reloaded successfully');
      return true;
    } catch (error) {
      Logger.error(`Error reloading Nginx: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  static async getDomainStatus(domain: string, verificationToken?: string): Promise<{
    propagated: boolean;
    verified: boolean;
    recommendedStatus: DomainStatus;
  }> {
    try {
      Logger.info(`Getting domain status for ${domain} via Sudo API`);
      
      const result = await SudoApiClient.getDomainStatus(domain);
      
      if (!result.success) {
        throw new Error(`Failed to get domain status: ${result.message}`);
      }
      
      let verified = false;
      if (verificationToken) {
        verified = await this.verifyDomainOwnership(domain, verificationToken);
      }
      
      return {
        propagated: result.data?.propagated || false,
        verified: result.data?.verified || verified,
        recommendedStatus: result.data?.verified || verified 
          ? DomainStatus.ACTIVE 
          : result.data?.propagated 
            ? DomainStatus.PROPAGATING 
            : DomainStatus.PENDING_DNS
      };
    } catch (error) {
      Logger.error(`Error getting domain status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        propagated: false,
        verified: false,
        recommendedStatus: DomainStatus.PENDING_DNS
      };
    }
  }

  static async setupDomain(domain: string, projectId: string, generateSSL: boolean = true): Promise<boolean> {
    try {
      Logger.info(`Setting up domain ${domain} for project ${projectId}`);
      
      if (isProd) {
        const result = await SudoApiClient.setupDomain({
          domain,
          project_id: projectId,
          ssl_enabled: generateSSL,
          email: env.ADMIN_EMAIL || 'admin@example.com'
        });
        
        return result.success;
      }
      
      Logger.info(`Development mode: Simulating domain setup for ${domain}`);
      return true;
    } catch (error) {
      Logger.error(`Error setting up domain ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }
  
  static async cleanupDomain(domain: string, projectId: string): Promise<boolean> {
    try {
      Logger.info(`Cleaning up domain ${domain}`);
      
      if (isProd) {
        const result = await SudoApiClient.cleanupDomain({
          domain,
          project_id: projectId
        });
        
        return result.success;
      }
      
      Logger.info(`Development mode: Simulating domain cleanup for ${domain}`);
      return true;
    } catch (error) {
      Logger.error(`Error cleaning up domain ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }
  /**
   * Get TXT records for a domain
   * @param domain Domain to get TXT records for
   * @returns Array of TXT records
   */
  static async getDomainTxtRecords(domain: string): Promise<string[][]> {
    try {
      Logger.info(`Getting TXT records for ${domain} via Sudo API`);
      
      const result = await SudoApiClient.getDomainTxtRecords(domain);
      
      if (!result.success) {
        Logger.warn(`Failed to get TXT records for ${domain}: ${result.message}`);
        return [];
      }
      
      return result.data?.records || [];
    } catch (error) {
      Logger.error(`Error getting TXT records for ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }
}
