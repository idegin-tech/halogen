import { isProd } from '../config/env.config';
import Logger from '../config/logger.config';
import { SSLManager, CertificateInfo } from '../lib/ssl-manager.lib';
import { SudoApiClient } from '../lib/sudo-api.client';

/**
 * @deprecated Use SSLManager from ssl-manager.lib.ts instead
 */
export interface SSLCertificateInfo {
  exists: boolean;
  domain: string;
  certPath?: string;
  keyPath?: string;
  expiryDate?: Date;
  isValid?: boolean;
}

/**
 * @deprecated Use SSLManager from ssl-manager.lib.ts instead
 */
export interface SSLSetupResult {
  success: boolean;
  message: string;
  certificateInfo?: SSLCertificateInfo;
  error?: string;
}

/**
 * @deprecated Use SSLManager from ssl-manager.lib.ts instead
 */
export interface SSLTestResult {
  success: boolean;
  testsPassed: number;
  totalTests: number;
  details: string[];
  errors: string[];
}

/**
 * @deprecated Use SSLManager from ssl-manager.lib.ts instead
 * This utility has been replaced by the SSLManager class which uses the Python API
 */
export class SSLSetupUtil {
  /**
   * Test SSL setup and configuration
   * @deprecated Use SSLManager from ssl-manager.lib.ts instead
   */
  static async testSSLSetup(domain: string = 'test.example.com'): Promise<SSLTestResult> {
    const result: SSLTestResult = {
      success: false,
      testsPassed: 0,
      totalTests: 3,
      details: [],
      errors: []
    };

    try {
      if (!isProd) {
        Logger.info(`[SSL_TEST] Skipping SSL tests in non-production environment`);
        result.success = true;
        result.testsPassed = result.totalTests;
        result.details.push('Skipped SSL tests in non-production environment');
        return result;
      }

      Logger.info(`[SSL_TEST] Testing SSL setup for domain: ${domain} via Python API`);

      // Test 1: Check Python API health
      const healthCheck = await SudoApiClient.healthCheck();
      if (healthCheck.success) {
        result.testsPassed++;
        result.details.push('✓ Python API is healthy');
      } else {
        result.errors.push('✗ Python API health check failed');
      }

      // Test 2: Check if SSL status endpoint works
      try {
        const sslStatus = await SudoApiClient.getSSLStatus('test.example.com');
        result.testsPassed++;
        result.details.push('✓ SSL status endpoint is working');
      } catch (error) {
        result.errors.push('✗ SSL status endpoint is not working');
      }

      // Test 3: Check if domain status endpoint works
      try {
        const domainStatus = await SudoApiClient.getDomainStatus('test.example.com');
        result.testsPassed++;
        result.details.push('✓ Domain status endpoint is working');
      } catch (error) {
        result.errors.push('✗ Domain status endpoint is not working');
      }

      result.success = result.testsPassed === result.totalTests;
      
      if (result.success) {
        Logger.info(`[SSL_TEST] All SSL setup tests passed (${result.testsPassed}/${result.totalTests})`);
      } else {
        Logger.warn(`[SSL_TEST] SSL setup tests completed with warnings (${result.testsPassed}/${result.totalTests} passed)`);
      }

    } catch (error: any) {
      Logger.error(`[SSL_TEST] SSL setup test failed: ${error.message}`);
      result.errors.push(`SSL setup test failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Generate SSL certificate using Certbot
   * @deprecated Use SSLManager.requestCertificate instead
   */
  static async generateSSLCertificate(domain: string, email: string = 'admin@example.com'): Promise<SSLSetupResult> {
    try {
      Logger.warn(`[SSL_GENERATE] SSLSetupUtil.generateSSLCertificate is deprecated. Use SSLManager.requestCertificate instead`);
      
      if (!isProd) {
        Logger.info(`[SSL_GENERATE] Skipping SSL certificate generation in non-production environment`);
        return { success: true, message: 'Skipped SSL generation in non-production environment' };
      }

      // Use the new SSLManager to request a certificate
      const certInfo = await SSLManager.requestCertificate(domain, 'migration');
      
      const certificateInfo: SSLCertificateInfo = {
        exists: certInfo.isValid,
        domain: certInfo.domain,
        certPath: certInfo.certPath,
        keyPath: certInfo.keyPath,
        expiryDate: certInfo.expiryDate,
        isValid: certInfo.isValid
      };
      
      return {
        success: certInfo.isValid,
        message: certInfo.isValid 
          ? `SSL certificate generated successfully for ${domain}` 
          : `Failed to generate SSL certificate for ${domain}`,
        certificateInfo
      };
    } catch (error: any) {
      Logger.error(`[SSL_GENERATE] Failed to generate SSL certificate for ${domain}: ${error.message}`);
      return {
        success: false,
        message: `Failed to generate SSL certificate: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Renew SSL certificate using Certbot
   * @deprecated Use SSLManager.renewCertificate instead
   */
  static async renewSSLCertificate(domain: string): Promise<SSLSetupResult> {
    try {
      Logger.warn(`[SSL_RENEW] SSLSetupUtil.renewSSLCertificate is deprecated. Use SSLManager.renewCertificate instead`);
      
      if (!isProd) {
        Logger.info(`[SSL_RENEW] Skipping SSL certificate renewal in non-production environment`);
        return { success: true, message: 'Skipped SSL renewal in non-production environment' };
      }

      // Use the new SSLManager to renew the certificate
      const certInfo = await SSLManager.renewCertificate(domain, 'migration');
      
      const certificateInfo: SSLCertificateInfo = {
        exists: certInfo.isValid,
        domain: certInfo.domain,
        certPath: certInfo.certPath,
        keyPath: certInfo.keyPath,
        expiryDate: certInfo.expiryDate,
        isValid: certInfo.isValid
      };
      
      return {
        success: certInfo.isValid,
        message: certInfo.isValid 
          ? `SSL certificate renewed successfully for ${domain}` 
          : `Failed to renew SSL certificate for ${domain}`,
        certificateInfo
      };
    } catch (error: any) {
      Logger.error(`[SSL_RENEW] Failed to renew SSL certificate for ${domain}: ${error.message}`);
      return {
        success: false,
        message: `Failed to renew SSL certificate: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Get SSL certificate information for a domain
   * @deprecated Use SSLManager.checkCertificate instead
   */
  static async getCertificateInfo(domain: string): Promise<SSLCertificateInfo> {
    Logger.warn(`[SSL_INFO] SSLSetupUtil.getCertificateInfo is deprecated. Use SSLManager.checkCertificate instead`);
    
    // Use the SSLManager to check the certificate
    const certInfo = await SSLManager.checkCertificate(domain);
    
    return {
      exists: certInfo.isValid,
      domain: certInfo.domain,
      certPath: certInfo.certPath,
      keyPath: certInfo.keyPath,
      expiryDate: certInfo.expiryDate,
      isValid: certInfo.isValid
    };
  }

  /**
   * Check if SSL certificate exists for domain
   * @deprecated Use SSLManager.checkCertificate instead
   */
  static async certificateExists(domain: string): Promise<boolean> {
    Logger.warn(`[SSL_EXISTS] SSLSetupUtil.certificateExists is deprecated. Use SSLManager.checkCertificate instead`);
    
    const certInfo = await SSLManager.checkCertificate(domain);
    return certInfo.isValid;
  }
}
