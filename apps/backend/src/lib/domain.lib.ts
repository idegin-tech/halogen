import { isProd, validateEnv } from '../config/env.config';
import dns from 'dns';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import mustache from 'mustache';
import Logger from '../config/logger.config';
import { DomainStatus } from '@halogen/common';
import PrivilegedCommandUtil from './privileged-command.util';
import { SSLManager } from './ssl.lib';

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

export class DomainLib {
  static async generateVerificationToken(domain: string, projectId: string): Promise<string> {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    return `${VERIFICATION_TXT_NAME}=${projectId}-${timestamp}-${randomString}`;
  }

  static async checkDNSPropagation(domain: string): Promise<boolean> {
    try {
      await lookup(domain);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async verifyDomainOwnership(domain: string, expectedToken: string): Promise<boolean> {
    try {
      const records = await resolveTxt(domain);
      
      for (const record of records) {
        for (const txt of record) {
          if (txt === expectedToken) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      Logger.error(`Error verifying domain ownership for ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }  static async generateNginxConfig(options: NginxConfigOptions): Promise<string> {
    try {
      // Skip file operations in non-production environments
      if (!isProd) {
        Logger.info(`Skipping Nginx config generation for ${options.domain} in non-production environment`);
        return `${options.domain}.conf`;
      }
      
      await fs.ensureDir(NGINX_TEMPLATES_DIR);
      await fs.ensureDir(NGINX_CONFIG_DIR);
      
      const templatePath = path.join(NGINX_TEMPLATES_DIR, options.sslCertPath ? 'ssl-domain.conf.template' : 'domain.conf.template');
      
      if (!await fs.pathExists(templatePath)) {
        await this.createDefaultTemplates();
      }
      
      const template = await fs.readFile(templatePath, 'utf8');
      const outputConfig = mustache.render(template, {
        domain: options.domain,
        projectId: options.projectId,
        apiEndpoint: env.API_ENDPOINT || 'api.mortarstudio.com',
        sslCertPath: options.sslCertPath || '/etc/letsencrypt/live/' + options.domain + '/fullchain.pem',
        sslKeyPath: options.sslKeyPath || '/etc/letsencrypt/live/' + options.domain + '/privkey.pem'
      });
      
      // Save config locally for reference - only in production
      if (isProd) {
        const localOutputPath = path.join(NGINX_CONFIG_DIR, `${options.domain}.conf`);
        await fs.writeFile(localOutputPath, outputConfig);
        
        // If in production, use privileged commands to create the actual Nginx config
        return this.deployNginxConfig(options.domain, outputConfig);
      }
      
      return `${options.domain}.conf`;
    } catch (error) {
      Logger.error(`Error generating Nginx config: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error('Failed to generate Nginx configuration');
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
      
      // Create a script to deploy the Nginx configuration
      const deployScript = `#!/bin/bash
# Create the configuration file
cat > "${configPath}" << 'EOL'
${configContent}
EOL

# Create symlink if it doesn't exist
if [ ! -f "${enabledPath}" ]; then
  ln -s "${configPath}" "${enabledPath}"
fi

# Test Nginx configuration
nginx -t

# If successful, reload Nginx
if [ $? -eq 0 ]; then
  nginx -s reload
  echo "Nginx configuration for ${domain} deployed successfully"
else
  echo "Nginx configuration test failed"
  exit 1
fi
`;
      
      // Execute the deployment script with elevated privileges
      const result = await PrivilegedCommandUtil.createAndExecuteScript(
        `deploy-nginx-${domain}.sh`,
        deployScript
      );
      
      if (!result.success) {
        throw new Error(`Failed to deploy Nginx configuration: ${result.stderr}`);
      }
      
      Logger.info(`Nginx configuration for ${domain} deployed successfully`);
      return configPath;
    } catch (error) {
      Logger.error(`Error deploying Nginx config: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error('Failed to deploy Nginx configuration');
    }
  }  static async reloadNginx(): Promise<boolean> {
    try {
      if (isProd) {
        // Use privileged command utility to reload Nginx
        const reloadScript = `#!/bin/bash
# Test Nginx configuration
nginx -t

# If successful, reload Nginx
if [ $? -eq 0 ]; then
  nginx -s reload
  echo "Nginx reloaded successfully"
  exit 0
else
  echo "Nginx configuration test failed"
  exit 1
fi
`;
        
        const result = await PrivilegedCommandUtil.createAndExecuteScript(
          'reload-nginx.sh',
          reloadScript
        );
        
        return result.success;
      } else {
        // Development mode - just log and return success
        Logger.info('Skipping Nginx reload in non-production environment');
        return true;
      }
    } catch (error) {
      Logger.error(`Error reloading Nginx: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      
      // Create default templates if they don't exist
      await this.createDefaultTemplates();
      
      // Set proper permissions for the directories in production
      try {
        await PrivilegedCommandUtil.executeCommand('chmod', ['-R', '755', NGINX_TEMPLATES_DIR]);
        await PrivilegedCommandUtil.executeCommand('chmod', ['-R', '755', NGINX_CONFIG_DIR]);
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
}
