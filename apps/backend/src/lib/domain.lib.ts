import { isProd, validateEnv } from '../config/env.config';
import dns from 'dns';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import mustache from 'mustache';
import Logger from '../config/logger.config';
import { DomainStatus } from '@halogen/common';
import { PrivilegedCommandUtil } from './privileged-command.util';

const env = validateEnv();
const lookup = promisify(dns.lookup);
const resolveTxt = promisify(dns.resolveTxt);
const execAsync = promisify(exec);

const NGINX_TEMPLATES_DIR = process.platform === 'win32'
  ? path.join(process.cwd(), 'nginx-templates')
  : '/home/msuser/nginx-templates';
const NGINX_CONFIG_DIR = process.platform === 'win32'
  ? path.join(process.cwd(), 'nginx-configs')
  : '/home/msuser/nginx-configs';

const NGINX_SITES_AVAILABLE = '/etc/nginx/sites-available';
const NGINX_SITES_ENABLED = '/etc/nginx/sites-enabled';

// Verification constants
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

export class DomainLib {  static async generateVerificationToken(domain: string, projectId: string): Promise<string> {
    try {
      // Import the model directly to avoid circular dependencies
      const ProjectModel = require('../modules/projects/projects.model').default;
      
      // Always try to find the project first and get its verification token
      const project = await ProjectModel.findById(projectId, { verificationToken: 1, verificationTokenUpdatedAt: 1 });
      
      // If project has a verification token, always use it
      if (project && project.verificationToken) {
        Logger.info(`Using existing verification token for project ${projectId}`);
        return project.verificationToken;
      }
      
      // Generate a new token if project doesn't have one
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const token = `${VERIFICATION_TXT_NAME}=${projectId}-${timestamp}-${randomString}`;
      
      // Update the project with the new token
      if (project) {
        project.verificationToken = token;
        project.verificationTokenUpdatedAt = new Date();
        await project.save();
        Logger.info(`Generated new verification token for project ${projectId}`);
      }
      
      return token;
    } catch (error) {
      Logger.error(`Error generating verification token: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Fallback to a temporary token if there's an error, but this should be rare
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      return `${VERIFICATION_TXT_NAME}=${projectId}-${timestamp}-${randomString}`;
    }
  }

  static async checkDNSPropagation(domain: string): Promise<boolean> {
    try {
      await lookup(domain);
      return true;
    } catch (error) {
      return false;
    }
  }  static async verifyDomainOwnership(domain: string, expectedToken: string): Promise<boolean> {
    try {
      Logger.info(`Verifying domain ownership for ${domain} with token: ${expectedToken}`);
      
      // Extract the token value for simplified matching
      const tokenValue = expectedToken.includes('=') ? expectedToken.split('=')[1] : expectedToken;
      
      // Try checking the TXT record on the main domain
      try {
        const records = await resolveTxt(domain);
        Logger.info(`Found ${records.length} TXT records for ${domain}`);
        
        for (const record of records) {
          for (const txt of record) {
            Logger.info(`Checking TXT record: "${txt}" against expected: "${expectedToken}"`);
            // Match against both full token or just the token value
            if (txt === expectedToken || txt === tokenValue) {
              Logger.info(`Match found! Root domain TXT record verified for ${domain}`);
              return true;
            }
          }
        }
      } catch (error) {
        Logger.warn(`Error checking TXT records for ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Try with standard DNS service prefixes
      try {
        const txtServiceDomain = `${VERIFICATION_TXT_NAME}.${domain}`;
        Logger.info(`Trying service-specific TXT location: ${txtServiceDomain}`);
        const txtServiceRecords = await resolveTxt(txtServiceDomain);
        
        for (const record of txtServiceRecords) {
          for (const txt of record) {
            // For service-specific subdomain, the value might just be the token part
            Logger.info(`Checking TXT record at service subdomain: "${txt}"`);
            if (txt === expectedToken || txt === tokenValue) {
              Logger.info(`Match found! Subdomain TXT record verified for ${domain}`);
              return true;
            }
          }
        }
      } catch (error) {
        // Ignore errors for this secondary check
        Logger.warn(`No TXT records found at service subdomain for ${domain}`);
      }
      
      // Try with _txt prefix (common pattern for some DNS providers)
      try {
        const txtPrefixDomain = `_txt.${domain}`;
        Logger.info(`Trying alternative TXT location: ${txtPrefixDomain}`);
        const txtPrefixRecords = await resolveTxt(txtPrefixDomain);
        
        for (const record of txtPrefixRecords) {
          for (const txt of record) {
            Logger.info(`Checking TXT record at _txt prefix: "${txt}"`);
            if (txt === expectedToken || txt === tokenValue) {
              Logger.info(`Match found! _txt prefix TXT record verified for ${domain}`);
              return true;
            }
          }
        }
      } catch (error) {
        // Ignore errors for this secondary check
        Logger.warn(`No TXT records found at _txt prefix for ${domain}`);
      }
      
      Logger.warn(`No matching TXT record found for ${domain}. Expected full token: ${expectedToken} or value: ${tokenValue}`);
      return false;
    } catch (error) {
      Logger.error(`Error verifying domain ownership for ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }static async generateNginxConfig(options: NginxConfigOptions): Promise<string> {
    const { domain, projectId, sslCertPath, sslKeyPath } = options;
    const templatePath = path.join(
      NGINX_TEMPLATES_DIR,
      sslCertPath ? 'ssl-domain.conf.template' : 'domain.conf.template'
    );

    try {
      // Read the template
      const template = await fs.readFile(templatePath, 'utf8');
      
      // Replace variables
      const config = template
        .replace(/\$\{DOMAIN\}/g, domain)
        .replace(/\$\{PROJECT_ID\}/g, projectId)
        .replace(/\$\{SSL_CERT_PATH\}/g, sslCertPath || '')
        .replace(/\$\{SSL_KEY_PATH\}/g, sslKeyPath || '');

      // Save local copy
      const localPath = path.join(NGINX_CONFIG_DIR, `${domain}.conf`);
      await fs.writeFile(localPath, config);

      // Deploy using PrivilegedCommandUtil
      const result = await PrivilegedCommandUtil.deployNginxConfig(domain, config);
      if (!result.success) {
        throw new Error(`Failed to deploy Nginx config: ${result.stderr}`);
      }

      return config;
    } catch (error) {
      Logger.error(`Error generating Nginx config: ${error}`);
      throw error;
    }
  }
  
  /**
   * Deploy Nginx configuration file to production server
   * @param domain Domain name
   * @param configContent Nginx configuration content
   * @returns Path to the deployed configuration file
   */
  static async deployNginxConfig(domain: string, configContent: string): Promise<string> {
    try {
      const configPath = path.join(NGINX_SITES_AVAILABLE, `${domain}.conf`);
      const enabledPath = path.join(NGINX_SITES_ENABLED, `${domain}.conf`);
      const localConfigPath = path.join(NGINX_CONFIG_DIR, `${domain}.conf`);

      // Save local copy
      await fs.writeFile(localConfigPath, configContent);

      // Copy to sites-available using privileged command
      const copyResult = await PrivilegedCommandUtil.executeCommand('cp', [localConfigPath, configPath]);
      if (!copyResult.success) {
        throw new Error(`Failed to copy config: ${copyResult.stderr}`);
      }

      // Check if symlink exists using stat instead of pathExists
      try {
        await fs.stat(enabledPath);
      } catch (error) {
        // If file doesn't exist, create symlink
        const linkResult = await PrivilegedCommandUtil.executeCommand('ln', ['-s', configPath, enabledPath]);
        if (!linkResult.success) {
          throw new Error(`Failed to create symlink: ${linkResult.stderr}`);
        }
      }

      // Test and reload nginx
      const testResult = await PrivilegedCommandUtil.executeCommand('nginx', ['-t']);
      if (!testResult.success) {
        throw new Error(`Nginx config test failed: ${testResult.stderr}`);
      }

      const reloadResult = await PrivilegedCommandUtil.executeCommand('nginx', ['-s', 'reload']);
      if (!reloadResult.success) {
        throw new Error(`Nginx reload failed: ${reloadResult.stderr}`);
      }

      return configPath;
    } catch (error) {
      Logger.error(`Error deploying Nginx config: ${error}`);
      throw error;
    }
  }  static async reloadNginx(): Promise<boolean> {
    try {
      if (isProd) {
        Logger.info(`[RELOAD_NGINX] Starting Nginx reload process`);
        
        // Use privileged command utility to reload Nginx
        const reloadScript = `#!/bin/bash
echo "[RELOAD_NGINX_SCRIPT] Starting Nginx reload"

# Check if Nginx is running
if systemctl is-active --quiet nginx; then
  echo "[RELOAD_NGINX_SCRIPT] Nginx is currently running"
else
  echo "[RELOAD_NGINX_SCRIPT] WARNING: Nginx is not running"
  
  # Start Nginx if it's not running
  systemctl start nginx
  
  if [ $? -eq 0 ]; then
    echo "[RELOAD_NGINX_SCRIPT] Started Nginx successfully"
  else
    echo "[RELOAD_NGINX_SCRIPT] Failed to start Nginx"
    exit 1
  fi
fi

# List the enabled sites
echo "[RELOAD_NGINX_SCRIPT] Current enabled sites:"
ls -la /etc/nginx/sites-enabled/

# Test Nginx configuration
echo "[RELOAD_NGINX_SCRIPT] Testing Nginx configuration"
nginx -t 2>&1

# If successful, reload Nginx
if [ $? -eq 0 ]; then
  echo "[RELOAD_NGINX_SCRIPT] Nginx configuration test successful, reloading"
  nginx -s reload
  
  # Verify reload was successful
  if [ $? -eq 0 ]; then
    echo "[RELOAD_NGINX_SCRIPT] Nginx reloaded successfully"
    systemctl status nginx | grep "active"
    exit 0
  else
    echo "[RELOAD_NGINX_SCRIPT] Failed to reload Nginx"
    exit 1
  fi
else
  echo "[RELOAD_NGINX_SCRIPT] Nginx configuration test failed"
  exit 1
fi
`;
        
        Logger.info(`[RELOAD_NGINX] Created reload script`);
        
        const result = await PrivilegedCommandUtil.createAndExecuteScript(
          'reload-nginx.sh',
          reloadScript
        );
        
        Logger.info(`[RELOAD_NGINX] Script execution result: success=${result.success}`);
        Logger.info(`[RELOAD_NGINX] Script stdout: ${result.stdout}`);
        
        if (result.stderr) {
          Logger.error(`[RELOAD_NGINX] Script stderr: ${result.stderr}`);
        }
        
        return result.success;
      } else {
        // Development mode - just log and return success
        Logger.info('[RELOAD_NGINX] Skipping Nginx reload in non-production environment');
        return true;
      }
    } catch (error) {
      Logger.error(`[RELOAD_NGINX] Error reloading Nginx: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }  static async createDefaultTemplates(): Promise<void> {
    // Only create templates in production
    if (!isProd) {
      Logger.info('Skipping template creation in non-production environment');
      return;
    }

    await fs.ensureDir(NGINX_TEMPLATES_DIR);
    
    const httpTemplate = `server {
    listen 80;
    server_name {{domain}};

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Project-ID {{projectId}};
    }

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}`;

    const httpsTemplate = `server {
    listen 80;
    server_name {{domain}};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name {{domain}};
    
    ssl_certificate {{sslCertPath}};
    ssl_certificate_key {{sslKeyPath}};
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy to application
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Project-ID {{projectId}};
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Deny access to hidden files
    location ~ /\\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}`;

    await fs.writeFile(path.join(NGINX_TEMPLATES_DIR, 'domain.conf.template'), httpTemplate);
    await fs.writeFile(path.join(NGINX_TEMPLATES_DIR, 'ssl-domain.conf.template'), httpsTemplate);
    
    // Create additional templates for specific use cases if needed
    const wildcardTemplate = `server {
    listen 80;
    server_name *.{{domain}};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name *.{{domain}};
    
    ssl_certificate {{sslCertPath}};
    ssl_certificate_key {{sslKeyPath}};
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Project-ID {{projectId}};
    }
}`;
    
    await fs.writeFile(path.join(NGINX_TEMPLATES_DIR, 'wildcard.conf.template'), wildcardTemplate);
  }  /**
   * Initialize domain management system
   * Creates necessary directories and templates
   */  static async initialize(): Promise<void> {
    // Skip initialization in non-production environments
    if (!isProd) {
      Logger.info('Skipping domain management system initialization in non-production environment');
      return;
    }

    try {
      // Ensure directories exist
      await fs.ensureDir(NGINX_TEMPLATES_DIR);
      await fs.ensureDir(NGINX_CONFIG_DIR);
      
      await this.createDefaultTemplates();
      
      try {
        //todo: check if this is still needed
        // await PrivilegedCommandUtil.executeCommand('chmod', ['-R', '755', NGINX_TEMPLATES_DIR]);
        // await PrivilegedCommandUtil.executeCommand('chmod', ['-R', '755', NGINX_CONFIG_DIR]);
        Logger.info('Set permissions on Nginx configuration directories');
      } catch (error) {
        Logger.warn(`Failed to set permissions on Nginx directories: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      Logger.info('Domain management system initialized successfully');
    } catch (error) {
      Logger.error(`Failed to initialize domain management system: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  static async getDomainStatus(domain: string, verificationToken?: string): Promise<{
    propagated: boolean;
    verified: boolean;
    recommendedStatus: DomainStatus;
  }> {
    const propagated = await this.checkDNSPropagation(domain);
    let verified = false;
    
    if (propagated && verificationToken) {
      verified = await this.verifyDomainOwnership(domain, verificationToken);
    }
    
    let recommendedStatus = DomainStatus.PENDING;
    
    if (!propagated) {
      recommendedStatus = DomainStatus.PENDING_DNS;
    } else if (propagated && !verified) {
      recommendedStatus = DomainStatus.PROPAGATING;
    } else if (propagated && verified) {
      recommendedStatus = DomainStatus.ACTIVE;
    }
    
    return {
      propagated,
      verified,
      recommendedStatus
    };
  }

  /**
   * Set up a domain with Nginx configuration and SSL certificate
   * This is the main method that should be called to configure a domain
   * @param domain Domain name
   * @param projectId Project ID
   * @param generateSSL Whether to generate SSL certificate
   * @returns Result of domain setup
   */  static async setupDomain(domain: string, projectId: string, generateSSL: boolean = true): Promise<boolean> {
    try {
      Logger.info(`Setting up domain ${domain} for project ${projectId}`);
      
      // In production, use privileged command utility
      if (isProd) {
        const result = await PrivilegedCommandUtil.setupDomain(domain, projectId, {
          configureOnly: !generateSSL
        });
        
        if (!result.success) {
          Logger.error(`Failed to set up domain ${domain}: ${result.stderr}`);
          return false;
        }
        
        Logger.info(`Domain ${domain} set up successfully`);
        return true;
      } else {
        // In development, skip all file operations and return success
        Logger.info(`Skipping domain setup for ${domain} in non-production environment`);
        return true;
      }
    } catch (error) {
      Logger.error(`Error setting up domain ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }
  
  /**
   * Remove Nginx configuration for a domain
   * @param domain Domain name
   * @returns True if successful
   */
  static async removeNginxConfig(domain: string): Promise<boolean> {
    try {
      // Skip file operations in non-production environments
      if (!isProd) {
        Logger.info(`Skipping Nginx config removal for ${domain} in non-production environment`);
        return true;
      }
      
      const configPath = path.join(NGINX_SITES_AVAILABLE, `${domain}.conf`);
      const enabledPath = path.join(NGINX_SITES_ENABLED, `${domain}.conf`);
      const localConfigPath = path.join(NGINX_CONFIG_DIR, `${domain}.conf`);
      
      // Create a script to remove the Nginx configuration
      const removeScript = `#!/bin/bash
# Remove symlink
if [ -L "${enabledPath}" ]; then
  rm "${enabledPath}"
fi

# Remove configuration file
if [ -f "${configPath}" ]; then
  rm "${configPath}"
fi

# Test Nginx configuration
nginx -t

# If successful, reload Nginx
if [ $? -eq 0 ]; then
  nginx -s reload
  echo "Nginx configuration for ${domain} removed successfully"
else
  echo "Nginx configuration test failed after removal"
  exit 1
fi
`;
      
      // Execute the removal script with elevated privileges
      const result = await PrivilegedCommandUtil.createAndExecuteScript(
        `remove-nginx-${domain}.sh`,
        removeScript
      );
      
      // Also remove local copy
      if (await fs.pathExists(localConfigPath)) {
        await fs.remove(localConfigPath);
      }
      
      if (!result.success) {
        throw new Error(`Failed to remove Nginx configuration: ${result.stderr}`);
      }
      
      Logger.info(`Nginx configuration for ${domain} removed successfully`);
      return true;
    } catch (error) {
      Logger.error(`Error removing Nginx config: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  static async getDomainTxtRecords(domain: string): Promise<string[][]> {
    try {
      return await resolveTxt(domain);
    } catch (error) {
      Logger.warn(`No TXT records found for domain ${domain}`);
      return [];
    }
  }
}
