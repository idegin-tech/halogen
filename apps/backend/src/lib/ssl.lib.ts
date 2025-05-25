import AcmeClient from 'acme-client';
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import Logger from '../config/logger.config';
import { isProd, validateEnv } from '../config/env.config';
import PrivilegedCommandUtil from './privileged-command.util';

const execAsync = promisify(exec);
const env = validateEnv();

const CERTS_DIR = '/etc/letsencrypt/live';

const ACME_DIR = '/home/msuser/.letsencrypt';
const ACCOUNT_KEY_PATH = path.join(ACME_DIR, 'account.key');
const CHALLENGES_DIR = '/var/www/certbot';

// Certbot configuration
const USE_CERTBOT = isProd;
const CERTBOT_EMAIL = env.ADMIN_EMAIL || 'ideginmedia@gmail.com';

export interface CertificateInfo {
  domain: string;
  issuedDate?: Date;
  expiryDate?: Date;
  certPath?: string;
  keyPath?: string;
  isValid: boolean;
}

export class SSLManager {
  private static acme: AcmeClient.Client;
  private static initialized = false; static async initializeClient(): Promise<void> {
    if (this.initialized) return;

    if (!isProd) {
      Logger.info('Skipping SSL manager initialization in non-production environment');
      this.initialized = true;
      return;
    }

    try {
      await fs.ensureDir(CERTS_DIR);
      await fs.ensureDir(ACME_DIR);

      let accountKey: Buffer;
      let privateKey: Buffer;

      try {
        accountKey = await fs.readFile(ACCOUNT_KEY_PATH);
      } catch (error) {

        Logger.info('Creating new ACME account key');
        privateKey = await AcmeClient.forge.createPrivateKey();
        await fs.writeFile(ACCOUNT_KEY_PATH, privateKey);

        try {
          await execAsync(`chmod 600 "${ACCOUNT_KEY_PATH}"`);
        } catch (chmodError) {
          Logger.warn(`Failed to set permissions on account key: ${chmodError instanceof Error ? chmodError.message : 'Unknown error'}`);
        }
        accountKey = privateKey;
      }

      this.acme = new AcmeClient.Client({
        directoryUrl: env.NODE_ENV === 'production'
          ? AcmeClient.directory.letsencrypt.production
          : AcmeClient.directory.letsencrypt.staging,
        accountKey
      });

      this.initialized = true;
      Logger.info('ACME client initialized');
    } catch (error) {
      Logger.error(`Failed to initialize ACME client: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error('Failed to initialize SSL manager');
    }
  }

  static async requestCertificate(domain: string, projectId: string): Promise<CertificateInfo> {
    try {
      // In production, use Certbot for certificate issuance
      if (USE_CERTBOT) {
        return this.requestCertificateWithCertbot(domain, projectId);
      }

      // Fallback to ACME client for development or when Certbot is not available
      await this.initializeClient();

      const domainDir = path.join(CERTS_DIR, domain);
      await fs.ensureDir(domainDir);

      const certPath = path.join(domainDir, 'fullchain.pem');
      const keyPath = path.join(domainDir, 'privkey.pem');

      // Fix TypeScript error by correctly accessing the AcmeClient API
      const privateKey = await AcmeClient.forge.createPrivateKey();
      const [key, csr] = await AcmeClient.forge.createCsr({
        commonName: domain,
        altNames: [domain]
      });

      await fs.writeFile(keyPath, key);

      try {
        await fs.ensureDir(CHALLENGES_DIR);

        const cert = await this.acme.auto({
          csr,
          email: env.ADMIN_EMAIL || 'admin@example.com',
          termsOfServiceAgreed: true,
          challengePriority: ['http-01'],
          challengeCreateFn: async (authz, challenge, keyAuthorization) => {
            if (challenge.type === 'http-01') {
              const filePath = path.join(CHALLENGES_DIR, `.well-known/acme-challenge/${challenge.token}`);
              await fs.ensureDir(path.dirname(filePath));
              await fs.writeFile(filePath, keyAuthorization);
            }
          },
          challengeRemoveFn: async (authz, challenge) => {
            if (challenge.type === 'http-01') {
              const filePath = path.join(CHALLENGES_DIR, `.well-known/acme-challenge/${challenge.token}`);
              await fs.remove(filePath);
            }
          }
        });

        await fs.writeFile(certPath, cert);

        const symLinkPath = path.join('/etc/letsencrypt/live', domain);
        await fs.ensureDir(path.dirname(symLinkPath));

        const realCertPath = path.resolve(certPath);
        const realKeyPath = path.resolve(keyPath);

        await execAsync(`ln -sf "${realCertPath}" "${symLinkPath}/fullchain.pem"`);
        await execAsync(`ln -sf "${realKeyPath}" "${symLinkPath}/privkey.pem"`);

        return {
          domain,
          issuedDate: new Date(),
          expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          certPath: symLinkPath + '/fullchain.pem',
          keyPath: symLinkPath + '/privkey.pem',
          isValid: true
        };
      } catch (error) {
        Logger.error(`Error acquiring certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    } catch (error) {
      Logger.error(`Failed to request certificate for ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        domain,
        isValid: false
      };
    }
  }  /**
   * Request a certificate using Certbot (for production environments)
   * @param domain Domain to request certificate for
   * @param projectId Project ID associated with the domain
   * @returns Certificate information
   */
  static async requestCertificateWithCertbot(domain: string, projectId: string): Promise<CertificateInfo> {
    try {
      Logger.info(`[SSL_CERTBOT] Starting certificate request for domain: ${domain}`);
      
      // Validate domain is ready for SSL generation
      const isValidForSSL = await this.validateDomainForSSL(domain);
      if (!isValidForSSL) {
        throw new Error(`Domain ${domain} is not ready for SSL certificate generation`);
      }

      const certPaths = {
        cert: path.join(CERTS_DIR, domain, 'fullchain.pem'),
        key: path.join(CERTS_DIR, domain, 'privkey.pem')
      };

      // Ensure webroot directory exists and has proper permissions
      Logger.info(`[SSL_CERTBOT] Ensuring webroot directory is set up for ${domain}`);
      const webrootResult = await PrivilegedCommandUtil.ensureWebrootDirectory();
      if (!webrootResult.success) {
        throw new Error(`Failed to set up webroot directory: ${webrootResult.stderr}`);
      }

      // Request certificate using certbot with webroot method
      Logger.info(`[SSL_CERTBOT] Requesting certificate for ${domain} using webroot method`);
      const result = await PrivilegedCommandUtil.executeCommand('certbot', [
        'certonly',
        '--webroot',
        '-w', CHALLENGES_DIR,
        '--non-interactive',
        '--agree-tos',
        '--email', CERTBOT_EMAIL,
        '-d', domain,
        '--keep-until-expiring',
        '--expand'
      ]);

      if (!result.success) {
        Logger.error(`[SSL_CERTBOT] Certbot command failed for ${domain}: ${result.stderr}`);
        throw new Error(`Certbot failed: ${result.stderr}`);
      }

      Logger.info(`[SSL_CERTBOT] Certbot command completed successfully for ${domain}`);

      // Verify certificate files exist
      const certExists = await fs.access(certPaths.cert).then(() => true).catch(() => false);
      const keyExists = await fs.access(certPaths.key).then(() => true).catch(() => false);

      if (!certExists || !keyExists) {
        Logger.error(`[SSL_CERTBOT] Certificate files not found after generation for ${domain}`);
        Logger.error(`[SSL_CERTBOT] Expected cert path: ${certPaths.cert}`);
        Logger.error(`[SSL_CERTBOT] Expected key path: ${certPaths.key}`);
        throw new Error('Certificate files not found after generation');
      }

      Logger.info(`[SSL_CERTBOT] Certificate files verified for ${domain}`);

      return {
        domain,
        issuedDate: new Date(),
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        certPath: certPaths.cert,
        keyPath: certPaths.key,
        isValid: true
      };
    } catch (error) {
      Logger.error(`[SSL_CERTBOT] Failed to request certificate for ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  static async checkCertificate(domain: string): Promise<CertificateInfo> {
    try {
      const certPath = path.join('/etc/letsencrypt/live', domain, 'fullchain.pem');
      const keyPath = path.join('/etc/letsencrypt/live', domain, 'privkey.pem');

      let notAfterMatch: RegExpMatchArray | null = null; let notBeforeMatch: RegExpMatchArray | null = null;      // In production, we need to use sudo to check certificate files
      if (isProd) {
        // Use privileged commands to check if certificate exists and get dates
        try {
          // Check if certificate files exist
          await PrivilegedCommandUtil.executeCommand(`sudo test -f "${certPath}" && sudo test -f "${keyPath}"`);
          
          // Extract certificate dates using openssl
          const result = await PrivilegedCommandUtil.executeCommand(`sudo openssl x509 -in "${certPath}" -noout -dates`);
          
          // Parse dates from output
          notAfterMatch = result.stdout.match(/notAfter=(.+)/);
          notBeforeMatch = result.stdout.match(/notBefore=(.+)/);
        } catch (error) {
          Logger.warn(`Certificate files not found for ${domain}: ${error}`);
          return {
            domain,
            isValid: false
          };
        }
        // In development, try direct file access
        const certExists = await fs.pathExists(certPath);
        const keyExists = await fs.pathExists(keyPath);

        if (!certExists || !keyExists) {
          return {
            domain,
            isValid: false
          };
        }

        const { stdout } = await execAsync(`openssl x509 -in "${certPath}" -noout -dates`);
        notAfterMatch = stdout.match(/notAfter=(.+)/);
        notBeforeMatch = stdout.match(/notBefore=(.+)/);
      }

      if (!notAfterMatch || !notBeforeMatch) {
        return {
          domain,
          isValid: false
        };
      }

      const expiryDate = new Date(notAfterMatch[1]);
      const issuedDate = new Date(notBeforeMatch[1]);
      const isValid = expiryDate > new Date();

      return {
        domain,
        issuedDate,
        expiryDate,
        certPath,
        keyPath,
        isValid
      };
    } catch (error) {
      Logger.error(`Failed to check certificate for ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        domain,
        isValid: false
      };
    }
  }
  static async revokeCertificate(domain: string): Promise<boolean> {
    try {
      const certPath = path.join('/etc/letsencrypt/live', domain, 'fullchain.pem');      if (isProd) {
        try {
          // Check if certificate directory exists
          await PrivilegedCommandUtil.executeCommand(`sudo test -d "/etc/letsencrypt/live/${domain}"`);
          
          // Revoke the certificate using Certbot
          await PrivilegedCommandUtil.executeCommand(`sudo certbot revoke --cert-path "${certPath}" --non-interactive --reason keycompromise`);
          
          // Delete the certificate
          await PrivilegedCommandUtil.executeCommand(`sudo certbot delete --cert-name "${domain}" --non-interactive`);
          
          Logger.info(`Certificate for ${domain} revoked successfully`);
          return true;
        } catch (error) {
          if (error instanceof Error && error.message.includes('test -d')) {
            Logger.info(`No certificate found for ${domain}`);
            return true;
          }
          throw error;
        }
      }

      // For development or if Certbot isn't being used
      await this.initializeClient();

      if (!await fs.pathExists(certPath)) {
        return true;
      }

      const cert = await fs.readFile(certPath);

      // Fix TypeScript error in revokeCertificate method
      // Use the correct enum values for certificate revocation
      await this.acme.revokeCertificate(cert, {
        reason: 1 // 1 = keyCompromise as per RFC 5280
      });

      return true;
    } catch (error) {
      Logger.error(`Failed to revoke certificate for ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  /**
   * Validate that the domain is properly configured before attempting SSL generation
   * @param domain Domain to validate
   * @returns True if domain is ready for SSL generation
   */
  static async validateDomainForSSL(domain: string): Promise<boolean> {
    try {
      if (!isProd) {
        Logger.info(`[SSL_VALIDATION] Skipping domain validation in non-production environment: ${domain}`);
        return true;
      }

      // Check if domain resolves to our server
      const { stdout: digOutput } = await execAsync(`dig +short ${domain}`);
      const resolvedIPs = digOutput.trim().split('\n').filter(ip => ip.length > 0);
      
      if (resolvedIPs.length === 0) {
        Logger.error(`[SSL_VALIDATION] Domain ${domain} does not resolve to any IP`);
        return false;
      }

      Logger.info(`[SSL_VALIDATION] Domain ${domain} resolves to: ${resolvedIPs.join(', ')}`);

      // Check if we can reach the domain via HTTP (needed for HTTP-01 challenge)
      try {
        const testUrl = `http://${domain}/.well-known/acme-challenge/test`;
        Logger.info(`[SSL_VALIDATION] Testing HTTP accessibility for ${domain}`);
          // Create a test file in the webroot
        const testFilePath = '/var/www/certbot/.well-known/acme-challenge/test';
        const testContent = 'test-challenge-response';
        
        try {
          Logger.info(`[SSL_VALIDATION] Creating test challenge file`);
          
          // Create directory and test file using individual commands
          await PrivilegedCommandUtil.executeCommand('sudo mkdir -p /var/www/certbot/.well-known/acme-challenge');
          await PrivilegedCommandUtil.executeCommand(`echo "${testContent}" | sudo tee "${testFilePath}" > /dev/null`);
          await PrivilegedCommandUtil.executeCommand(`sudo chmod 644 "${testFilePath}"`);
          
          Logger.info(`[SSL_VALIDATION] Test file created successfully`);
        } catch (createError) {
          Logger.error(`[SSL_VALIDATION] Failed to create test challenge file: ${createError}`);
          return false;
        }

        // Clean up test file
        try {
          await PrivilegedCommandUtil.executeCommand(`sudo rm -f "${testFilePath}"`);
          Logger.info(`[SSL_VALIDATION] Test file cleaned up`);
        } catch (cleanupError) {
          Logger.warn(`[SSL_VALIDATION] Failed to clean up test file: ${cleanupError}`);
        }

        return true;
      } catch (httpError) {
        Logger.warn(`[SSL_VALIDATION] HTTP test failed for ${domain}: ${httpError instanceof Error ? httpError.message : 'Unknown error'}`);
        return true; // Don't fail SSL generation just because HTTP test failed
      }
    } catch (error) {
      Logger.error(`[SSL_VALIDATION] Domain validation failed for ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  /**
   * Check if a certificate needs renewal (expires within 30 days)
   * @param domain Domain to check
   * @returns True if certificate needs renewal
   */
  static async needsRenewal(domain: string): Promise<boolean> {
    try {
      const cert = await this.checkCertificate(domain);
      
      if (!cert.isValid || !cert.expiryDate) {
        return true; // Invalid or missing certificate needs renewal
      }
      
      // Check if certificate expires within 30 days
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return cert.expiryDate <= thirtyDaysFromNow;
    } catch (error) {
      Logger.error(`Error checking renewal status for ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return true; // If we can't check, assume it needs renewal
    }
  }

  /**
   * Renew an existing certificate
   * @param domain Domain to renew certificate for
   * @param projectId Project ID associated with the domain
   * @returns Certificate information after renewal
   */
  static async renewCertificate(domain: string, projectId: string): Promise<CertificateInfo> {
    try {
      Logger.info(`[SSL_RENEWAL] Starting certificate renewal for domain: ${domain}`);
      
      if (USE_CERTBOT) {
        // For Certbot, we can use the renew command
        const renewResult = await PrivilegedCommandUtil.executeCommand('certbot', [
          'renew',
          '--cert-name', domain,
          '--non-interactive'
        ]);

        if (renewResult.success) {
          Logger.info(`[SSL_RENEWAL] Certificate renewed successfully for ${domain}`);
          return await this.checkCertificate(domain);
        } else {
          Logger.warn(`[SSL_RENEWAL] Certbot renew failed for ${domain}, attempting fresh certificate request`);
          // Fall back to requesting a new certificate
          return await this.requestCertificate(domain, projectId);
        }
      } else {
        // For ACME client, request a new certificate
        return await this.requestCertificate(domain, projectId);
      }
    } catch (error) {
      Logger.error(`[SSL_RENEWAL] Failed to renew certificate for ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}
