/**
 * Utility class for SSL operations via the Python Sudo API
 * This replaces the direct SSL operations previously handled in Node.js
 */
import { DomainStatus } from '@halogen/common';
import Logger from '../config/logger.config';
import { SudoApiClient } from './sudo-api.client';
import validateEnv, { isProd } from '../config/env.config';

const env = validateEnv();

export interface CertificateInfo {
  domain: string;
  isValid: boolean;
  expiryDate?: Date;
  certPath?: string;
  keyPath?: string;
}

export class SSLManager {
  /**
   * Request a certificate for a domain
   * @param domain Domain to request certificate for
   * @param projectId Project ID associated with the domain
   * @returns Certificate information
   */
  static async requestCertificate(domain: string, projectId: string): Promise<CertificateInfo> {
    try {
      Logger.info(`Requesting SSL certificate for ${domain} via Sudo API`);
      
      const result = await SudoApiClient.generateSSLCertificate({
        domain,
        project_id: projectId,
        email: env.ADMIN_EMAIL
      });
      
      if (!result.success) {
        Logger.error(`Failed to generate SSL certificate for ${domain}: ${result.message}`);
        return {
          domain,
          isValid: false
        };
      }
      
      Logger.info(`SSL certificate generated successfully for ${domain}`);
      
      return {
        domain,
        isValid: true,
        expiryDate: result.data?.expiry_date ? new Date(result.data.expiry_date) : undefined,
        certPath: result.data?.cert_path,
        keyPath: result.data?.key_path
      };
    } catch (error) {
      Logger.error(`Error requesting SSL certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        domain,
        isValid: false
      };
    }
  }
  /**
   * Check certificate status for a domain
   * @param domain Domain to check certificate for
   * @returns Certificate information
   */
  static async checkCertificate(domain: string): Promise<CertificateInfo> {
    try {
      Logger.info(`Checking SSL certificate for ${domain} via Sudo API`);
      
      const result = await SudoApiClient.getSSLStatus(domain);
      
      if (!result.success) {
        Logger.warn(`Failed to check SSL certificate for ${domain}: ${result.message}`);
        return {
          domain,
          isValid: false
        };
      }
      
      // Ensure expiryDate is always a Date object when valid
      let expiryDate: Date | undefined = undefined;
      if (result.data?.expiry_date) {
        if (result.data.expiry_date instanceof Date) {
          expiryDate = result.data.expiry_date;
        } else {
          expiryDate = new Date(result.data.expiry_date);
        }
      }
      
      return {
        domain,
        isValid: result.data?.is_valid || false,
        expiryDate
      };
    } catch (error) {
      Logger.error(`Error checking SSL certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        domain,
        isValid: false
      };
    }
  }

  /**
   * Revoke certificate for a domain
   * @param domain Domain to revoke certificate for
   * @returns Success status
   */
  static async revokeCertificate(domain: string): Promise<boolean> {
    try {
      Logger.info(`Revoking SSL certificate for ${domain} via Sudo API`);
      
      const result = await SudoApiClient.removeSSLCertificate({
        domain,
        project_id: 'cleanup' // Project ID not needed for removal
      });
      
      if (!result.success) {
        Logger.error(`Failed to revoke SSL certificate for ${domain}: ${result.message}`);
        return false;
      }
      
      Logger.info(`SSL certificate revoked successfully for ${domain}`);
      return true;
    } catch (error) {
      Logger.error(`Error revoking SSL certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  /**
   * Check if a domain needs SSL certificate renewal
   * @param domain Domain to check
   * @returns Whether renewal is needed
   */
  static async needsRenewal(domain: string): Promise<boolean> {
    try {
      Logger.info(`Checking if SSL certificate for ${domain} needs renewal via Sudo API`);
      
      const certificateInfo = await this.checkCertificate(domain);
      
      if (!certificateInfo.isValid) {
        return true;
      }
      
      if (!certificateInfo.expiryDate) {
        return false;
      }
      
      // Consider renewal needed if expiry is within 30 days
      const renewalThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      const timeUntilExpiry = certificateInfo.expiryDate.getTime() - Date.now();
      
      return timeUntilExpiry < renewalThreshold;
    } catch (error) {
      Logger.error(`Error checking if SSL certificate needs renewal: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  /**
   * Renew certificate for a domain
   * @param domain Domain to renew certificate for
   * @param projectId Project ID associated with the domain
   * @returns Certificate information
   */
  static async renewCertificate(domain: string, projectId: string): Promise<CertificateInfo> {
    try {
      Logger.info(`Renewing SSL certificate for ${domain} via Sudo API`);
      
      const result = await SudoApiClient.renewSSLCertificate({
        domain,
        project_id: projectId
      });
      
      if (!result.success) {
        Logger.error(`Failed to renew SSL certificate for ${domain}: ${result.message}`);
        return {
          domain,
          isValid: false
        };
      }
      
      Logger.info(`SSL certificate renewed successfully for ${domain}`);
      
      return {
        domain,
        isValid: true,
        expiryDate: result.data?.expiry_date ? new Date(result.data.expiry_date) : undefined
      };
    } catch (error) {
      Logger.error(`Error renewing SSL certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        domain,
        isValid: false
      };
    }
  }

  /**
   * Validate domain for SSL
   * This checks if the domain meets the requirements for SSL generation
   * @param domain Domain to validate
   * @returns Whether the domain is valid for SSL
   */
  static async validateDomainForSSL(domain: string): Promise<boolean> {
    try {
      // Check if domain DNS is properly configured
      const result = await SudoApiClient.getDomainStatus(domain);
      
      // Domain needs to be propagated and verified to get SSL
      return result.success && result.data?.propagated && result.data?.verified;
    } catch (error) {
      Logger.error(`Error validating domain for SSL: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  /**
   * Initialize SSL client and verify SSL capabilities
   * Checks if Python API is healthy and SSL tools are available
   */
  static async initializeClient(): Promise<void> {
    try {
      if (!isProd) {
        Logger.info('Skipping SSL client initialization in non-production environment');
        return;
      }

      Logger.info('Initializing SSL manager and verifying SSL capabilities');
      
      // Check if Python API is healthy
      const healthCheck = await SudoApiClient.healthCheck();
      
      if (!healthCheck.success) {
        Logger.warn('SSL client initialization - Python API health check failed');
        return;
      }
      
      // Check if dependencies are available in the Python API
      if (healthCheck.data?.dependencies) {
        const dependencies = healthCheck.data.dependencies as Record<string, boolean>;
        
        if (!dependencies.certbot) {
          Logger.warn('SSL client initialization - Certbot is not available on the server');
        } else {
          Logger.info('SSL client initialized - Certbot is available');
        }
        
        if (!dependencies.nginx) {
          Logger.warn('SSL client initialization - Nginx is not available on the server');
        } else {
          Logger.info('SSL client initialized - Nginx is available');
        }
      }

      Logger.info('SSL manager initialized successfully');
    } catch (error) {
      Logger.error(`Error initializing SSL client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
