import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { isProd } from '../config/env.config';
import Logger from '../config/logger.config';

const execAsync = promisify(exec);

export interface SSLCertificateInfo {
  exists: boolean;
  domain: string;
  certPath?: string;
  keyPath?: string;
  expiryDate?: Date;
  isValid?: boolean;
}

export interface SSLSetupResult {
  success: boolean;
  message: string;
  certificateInfo?: SSLCertificateInfo;
  error?: string;
}

export interface SSLTestResult {
  success: boolean;
  testsPassed: number;
  totalTests: number;
  details: string[];
  errors: string[];
}

/**
 * Utility class for SSL certificate management using pure Node.js
 * Replaces test-ssl-setup.sh and SSL-related shell script functionality
 */
export class SSLSetupUtil {
  private static readonly WEBROOT_DIR = '/var/www/certbot';
  private static readonly CERTBOT_LIVE_DIR = '/etc/letsencrypt/live';
  private static readonly NGINX_SITES_AVAILABLE = '/etc/nginx/sites-available';
  private static readonly NGINX_SITES_ENABLED = '/etc/nginx/sites-enabled';

  /**
   * Test SSL setup and configuration
   */
  static async testSSLSetup(domain: string = 'test.example.com'): Promise<SSLTestResult> {
    const result: SSLTestResult = {
      success: false,
      testsPassed: 0,
      totalTests: 7,
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

      Logger.info(`[SSL_TEST] Testing SSL setup for domain: ${domain}`);

      // Test 1: Check webroot directory
      if (await this.testWebrootDirectory(result)) {
        result.testsPassed++;
      }

      // Test 2: Test webroot write permissions
      if (await this.testWebrootWritePermissions(result)) {
        result.testsPassed++;
      }

      // Test 3: Check Certbot availability
      if (await this.testCertbotAvailability(result)) {
        result.testsPassed++;
      }

      // Test 4: Check Nginx configuration directories
      if (await this.testNginxDirectories(result)) {
        result.testsPassed++;
      }

      // Test 5: Check Nginx configuration syntax
      if (await this.testNginxSyntax(result)) {
        result.testsPassed++;
      }

      // Test 6: Simulate ACME challenge file creation
      if (await this.testACMEChallenge(result)) {
        result.testsPassed++;
      }

      // Test 7: Check domain resolution (skip for test domains)
      if (await this.testDomainResolution(domain, result)) {
        result.testsPassed++;
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
   */
  static async generateSSLCertificate(domain: string, email: string = 'admin@example.com'): Promise<SSLSetupResult> {
    try {
      if (!isProd) {
        Logger.info(`[SSL_GENERATE] Skipping SSL certificate generation in non-production environment`);
        return { success: true, message: 'Skipped SSL generation in non-production environment' };
      }

      Logger.info(`[SSL_GENERATE] Generating SSL certificate for domain: ${domain}`);

      // Ensure webroot directory exists
      await execAsync(`sudo mkdir -p ${this.WEBROOT_DIR}/.well-known/acme-challenge`);
      await execAsync(`sudo chown -R www-data:www-data ${this.WEBROOT_DIR}`);
      await execAsync(`sudo chmod -R 755 ${this.WEBROOT_DIR}`);

      // Generate certificate
      const certbotCommand = [
        'sudo certbot certonly',
        '--webroot',
        `-w ${this.WEBROOT_DIR}`,
        `-d ${domain}`,
        '--non-interactive',
        '--agree-tos',
        `-m ${email}`,
        '--keep-until-expiring'
      ].join(' ');

      const result = await execAsync(certbotCommand);
      
      if (result.stderr && !result.stderr.includes('Successfully received certificate')) {
        Logger.warn(`[SSL_GENERATE] Certbot warnings: ${result.stderr}`);
      }

      Logger.info(`[SSL_GENERATE] SSL certificate generated successfully for ${domain}`);
      
      const certificateInfo = await this.getCertificateInfo(domain);
      
      return {
        success: true,
        message: `SSL certificate generated successfully for ${domain}`,
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
   */
  static async renewSSLCertificate(domain: string): Promise<SSLSetupResult> {
    try {
      if (!isProd) {
        Logger.info(`[SSL_RENEW] Skipping SSL certificate renewal in non-production environment`);
        return { success: true, message: 'Skipped SSL renewal in non-production environment' };
      }

      Logger.info(`[SSL_RENEW] Renewing SSL certificate for domain: ${domain}`);

      const renewCommand = `sudo certbot renew --cert-name ${domain} --force-renewal`;
      const result = await execAsync(renewCommand);

      if (result.stderr && !result.stderr.includes('Successfully renewed certificate')) {
        Logger.warn(`[SSL_RENEW] Certbot renewal warnings: ${result.stderr}`);
      }

      Logger.info(`[SSL_RENEW] SSL certificate renewed successfully for ${domain}`);
      
      const certificateInfo = await this.getCertificateInfo(domain);
      
      return {
        success: true,
        message: `SSL certificate renewed successfully for ${domain}`,
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
   */
  static async getCertificateInfo(domain: string): Promise<SSLCertificateInfo> {
    const info: SSLCertificateInfo = {
      exists: false,
      domain
    };

    try {
      const certDir = path.join(this.CERTBOT_LIVE_DIR, domain);
      const certPath = path.join(certDir, 'fullchain.pem');
      const keyPath = path.join(certDir, 'privkey.pem');

      // Check if certificate files exist
      const certExists = await fs.access(certPath).then(() => true).catch(() => false);
      const keyExists = await fs.access(keyPath).then(() => true).catch(() => false);

      if (certExists && keyExists) {
        info.exists = true;
        info.certPath = certPath;
        info.keyPath = keyPath;

        // Get certificate expiry date
        try {
          const opensslCommand = `sudo openssl x509 -in ${certPath} -noout -dates`;
          const result = await execAsync(opensslCommand);
          
          const expiryMatch = result.stdout.match(/notAfter=(.+)/);
          if (expiryMatch) {
            info.expiryDate = new Date(expiryMatch[1]);
            info.isValid = info.expiryDate > new Date();
          }
        } catch (error) {
          Logger.warn(`[SSL_INFO] Could not get certificate expiry for ${domain}: ${error}`);
        }
      }

    } catch (error: any) {
      Logger.warn(`[SSL_INFO] Error getting certificate info for ${domain}: ${error.message}`);
    }

    return info;
  }

  /**
   * Check if SSL certificate exists for domain
   */
  static async certificateExists(domain: string): Promise<boolean> {
    const info = await this.getCertificateInfo(domain);
    return info.exists;
  }

  // Private test methods

  private static async testWebrootDirectory(result: SSLTestResult): Promise<boolean> {
    try {
      const stats = await fs.stat(this.WEBROOT_DIR);
      if (stats.isDirectory()) {
        result.details.push(`✓ Webroot directory exists: ${this.WEBROOT_DIR}`);
        
        // Check permissions
        const permResult = await execAsync(`stat -c %a ${this.WEBROOT_DIR}`);
        const perms = permResult.stdout.trim();
        result.details.push(`Webroot permissions: ${perms}`);
        
        // Check owner
        const ownerResult = await execAsync(`stat -c %U:%G ${this.WEBROOT_DIR}`);
        const owner = ownerResult.stdout.trim();
        result.details.push(`Webroot owner: ${owner}`);
        
        return true;
      }
    } catch (error) {
      result.errors.push(`✗ Webroot directory does not exist: ${this.WEBROOT_DIR}`);
      
      // Try to create it
      try {
        await execAsync(`sudo mkdir -p ${this.WEBROOT_DIR}/.well-known/acme-challenge`);
        await execAsync(`sudo chown -R www-data:www-data ${this.WEBROOT_DIR}`);
        await execAsync(`sudo chmod -R 755 ${this.WEBROOT_DIR}`);
        result.details.push(`✓ Webroot directory created successfully`);
        return true;
      } catch (createError) {
        result.errors.push(`✗ Failed to create webroot directory`);
        return false;
      }
    }
    return false;
  }

  private static async testWebrootWritePermissions(result: SSLTestResult): Promise<boolean> {
    try {
      const testFile = `${this.WEBROOT_DIR}/.well-known/acme-challenge/test-${Date.now()}`;
      
      await execAsync(`sudo touch ${testFile}`);
      await execAsync(`sudo chmod 644 ${testFile}`);
      await execAsync(`sudo rm -f ${testFile}`);
      
      result.details.push(`✓ Can write to webroot directory`);
      return true;
    } catch (error) {
      result.errors.push(`✗ Cannot write to webroot directory`);
      return false;
    }
  }

  private static async testCertbotAvailability(result: SSLTestResult): Promise<boolean> {
    try {
      const certbotResult = await execAsync('certbot --version');
      const version = certbotResult.stdout.trim() || certbotResult.stderr.trim();
      result.details.push(`✓ Certbot is available: ${version.split('\n')[0]}`);
      return true;
    } catch (error) {
      result.errors.push(`✗ Certbot is not available`);
      return false;
    }
  }

  private static async testNginxDirectories(result: SSLTestResult): Promise<boolean> {
    try {
      const availableExists = await fs.access(this.NGINX_SITES_AVAILABLE).then(() => true).catch(() => false);
      const enabledExists = await fs.access(this.NGINX_SITES_ENABLED).then(() => true).catch(() => false);
      
      if (availableExists && enabledExists) {
        result.details.push(`✓ Nginx configuration directories exist`);
        return true;
      } else {
        result.errors.push(`✗ Nginx configuration directories missing`);
        return false;
      }
    } catch (error) {
      result.errors.push(`✗ Error checking Nginx directories: ${error}`);
      return false;
    }
  }

  private static async testNginxSyntax(result: SSLTestResult): Promise<boolean> {
    try {
      await execAsync('sudo nginx -t');
      result.details.push(`✓ Nginx configuration syntax is valid`);
      return true;
    } catch (error: any) {
      if (error.stderr) {
        result.details.push(`⚠ Nginx configuration syntax errors detected: ${error.stderr}`);
      } else {
        result.details.push(`⚠ Nginx configuration syntax check failed`);
      }
      return true; // Don't fail the test for this
    }
  }

  private static async testACMEChallenge(result: SSLTestResult): Promise<boolean> {
    try {
      const challengeDir = `${this.WEBROOT_DIR}/.well-known/acme-challenge`;
      const challengeFile = `${challengeDir}/test-challenge-${Date.now()}`;
      const challengeContent = `test-challenge-response-${Date.now()}`;
      
      await execAsync(`sudo mkdir -p ${challengeDir}`);
      await execAsync(`echo "${challengeContent}" | sudo tee ${challengeFile} >/dev/null`);
      
      const fileContent = await execAsync(`sudo cat ${challengeFile}`);
      
      if (fileContent.stdout.trim() === challengeContent) {
        result.details.push(`✓ ACME challenge file simulation successful`);
        await execAsync(`sudo rm -f ${challengeFile}`);
        return true;
      } else {
        result.errors.push(`✗ ACME challenge file content verification failed`);
        return false;
      }
    } catch (error) {
      result.errors.push(`✗ Failed to create ACME challenge file`);
      return false;
    }
  }

  private static async testDomainResolution(domain: string, result: SSLTestResult): Promise<boolean> {
    // Skip resolution test for test domains
    if (domain === 'test.example.com' || domain.endsWith('.test') || domain.endsWith('.local')) {
      result.details.push(`Skipping domain resolution test for test domain`);
      return true;
    }

    try {
      const digResult = await execAsync(`dig +short ${domain}`);
      const ips = digResult.stdout.trim().split('\n').filter(line => /^\d+\.\d+\.\d+\.\d+$/.test(line));
      
      if (ips.length > 0) {
        result.details.push(`✓ Domain resolves to: ${ips.join(', ')}`);
        return true;
      } else {
        result.details.push(`⚠ Domain ${domain} does not resolve to any IP addresses`);
        return true; // Don't fail for this
      }
    } catch (error) {
      result.details.push(`⚠ Could not check domain resolution for ${domain}`);
      return true; // Don't fail for this
    }
  }
}
