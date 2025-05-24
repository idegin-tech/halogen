import AcmeClient from 'acme-client';
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import Logger from '../config/logger.config';
import { validateEnv } from '../config/env.config';
import PrivilegedCommandUtil from './privileged-command.util';

const execAsync = promisify(exec);
const env = validateEnv();

// Store certificates outside project directory
const CERTS_DIR = process.platform === 'win32' 
  ? 'C:\\ssl\\certificates' 
  : '/etc/letsencrypt/live';
const ACCOUNT_KEY_PATH = path.join(CERTS_DIR, 'account.key');
const CHALLENGES_DIR = '/var/www/certbot';

// Certbot configuration
const USE_CERTBOT = process.platform !== 'win32' && env.NODE_ENV === 'production';
const CERTBOT_EMAIL = env.ADMIN_EMAIL || 'admin@example.com';

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
  private static initialized = false;

  static async initializeClient(): Promise<void> {
    if (this.initialized) return;

    try {
      await fs.ensureDir(CERTS_DIR);
      
      let accountKey: Buffer;
      
      try {
        accountKey = await fs.readFile(ACCOUNT_KEY_PATH);
      } catch (error) {
        // Fix for TS error - AcmeClient.forge.createPrivateKey() returns the key directly
        const privateKey = await AcmeClient.forge.createPrivateKey();
        await fs.writeFile(ACCOUNT_KEY_PATH, privateKey);
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
  }

  /**
   * Request a certificate using Certbot (for production environments)
   * @param domain Domain to request certificate for
   * @param projectId Project ID associated with the domain
   * @returns Certificate information
   */
  static async requestCertificateWithCertbot(domain: string, projectId: string): Promise<CertificateInfo> {
    try {
      Logger.info(`Requesting certificate for ${domain} using Certbot`);
      
      // Ensure Nginx configuration exists for the domain
      // This is required for Certbot to validate ownership
      const domainConfigPath = path.join('/etc/nginx/sites-available', `${domain}.conf`);
      
      if (!await fs.pathExists(domainConfigPath)) {
        // Generate a basic Nginx config for Certbot validation
        const nginxConfig = `server {
    listen 80;
    server_name ${domain};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 444;
    }
}`;
        
        // Create the Nginx config using privileged commands
        const createConfigScript = `#!/bin/bash
cat > "${domainConfigPath}" << 'EOL'
${nginxConfig}
EOL

if [ ! -f "/etc/nginx/sites-enabled/${domain}.conf" ]; then
    ln -s "${domainConfigPath}" "/etc/nginx/sites-enabled/${domain}.conf"
fi

nginx -t && nginx -s reload
`;
        
        const createConfigResult = await PrivilegedCommandUtil.createAndExecuteScript(
          `create-nginx-config-${domain}.sh`,
          createConfigScript
        );
        
        if (!createConfigResult.success) {
          throw new Error(`Failed to create Nginx config: ${createConfigResult.stderr}`);
        }
      }
      
      // Create the Certbot script
      const certbotScript = `#!/bin/bash
# Ensure the certbot directories exist
mkdir -p /var/www/certbot
mkdir -p /etc/letsencrypt/live

# Request certificate using Certbot
certbot certonly --nginx \
  -d ${domain} \
  --non-interactive \
  --agree-tos \
  -m ${CERTBOT_EMAIL} \
  --keep-until-expiring

# Check if certificate was successfully issued
if [ -d "/etc/letsencrypt/live/${domain}" ]; then
  echo "Certificate successfully issued for ${domain}"
  exit 0
else
  echo "Failed to issue certificate for ${domain}"
  exit 1
fi
`;
      
      // Execute the Certbot script with elevated privileges
      const certbotResult = await PrivilegedCommandUtil.createAndExecuteScript(
        `certbot-${domain}.sh`,
        certbotScript
      );
      
      if (!certbotResult.success) {
        Logger.error(`Certbot failed for ${domain}: ${certbotResult.stderr}`);
        throw new Error(`Failed to obtain certificate: ${certbotResult.stderr}`);
      }
      
      // Check if certificate was issued successfully
      const certPath = path.join('/etc/letsencrypt/live', domain, 'fullchain.pem');
      const keyPath = path.join('/etc/letsencrypt/live', domain, 'privkey.pem');
      
      if (!await fs.pathExists(certPath) || !await fs.pathExists(keyPath)) {
        throw new Error('Certificate files not found after Certbot execution');
      }
      
      // Get certificate details
      const { stdout } = await execAsync(`openssl x509 -in "${certPath}" -noout -dates`);
      const notAfterMatch = stdout.match(/notAfter=(.+)/);
      const notBeforeMatch = stdout.match(/notBefore=(.+)/);
      
      if (!notAfterMatch || !notBeforeMatch) {
        throw new Error('Failed to parse certificate dates');
      }
      
      const expiryDate = new Date(notAfterMatch[1]);
      const issuedDate = new Date(notBeforeMatch[1]);
      
      return {
        domain,
        issuedDate,
        expiryDate,
        certPath,
        keyPath,
        isValid: true
      };
    } catch (error) {
      Logger.error(`Failed to request certificate with Certbot for ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        domain,
        isValid: false
      };
    }
  }

  static async checkCertificate(domain: string): Promise<CertificateInfo> {
    try {
      const certPath = path.join('/etc/letsencrypt/live', domain, 'fullchain.pem');
      const keyPath = path.join('/etc/letsencrypt/live', domain, 'privkey.pem');
      
      const certExists = await fs.pathExists(certPath);
      const keyExists = await fs.pathExists(keyPath);
      
      if (!certExists || !keyExists) {
        return {
          domain,
          isValid: false
        };
      }
      
      const { stdout } = await execAsync(`openssl x509 -in "${certPath}" -noout -dates`);
      const notAfterMatch = stdout.match(/notAfter=(.+)/);
      const notBeforeMatch = stdout.match(/notBefore=(.+)/);
      
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
      await this.initializeClient();
      
      const certPath = path.join('/etc/letsencrypt/live', domain, 'fullchain.pem');
      
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
}
