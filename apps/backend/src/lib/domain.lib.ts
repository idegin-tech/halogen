import dns from 'dns';
import { promisify } from 'util';
import { DomainStatus } from '@halogen/common';
import Logger from '../config/logger.config';
import { exec } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import mustache from 'mustache';
import { validateEnv } from '../config/env.config';

const env = validateEnv();
const lookup = promisify(dns.lookup);
const resolveTxt = promisify(dns.resolveTxt);
const execAsync = promisify(exec);

const NGINX_TEMPLATES_DIR = path.join(process.cwd(), 'nginx-templates');
const NGINX_CONFIG_DIR = path.join(process.cwd(), 'nginx-configs');
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
  }

  static async generateNginxConfig(options: NginxConfigOptions): Promise<string> {
    try {
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
        sslCertPath: options.sslCertPath,
        sslKeyPath: options.sslKeyPath
      });
      
      const outputPath = path.join(NGINX_CONFIG_DIR, `${options.domain}.conf`);
      await fs.writeFile(outputPath, outputConfig);
      
      return outputPath;
    } catch (error) {
      Logger.error(`Error generating Nginx config: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error('Failed to generate Nginx configuration');
    }
  }

  static async reloadNginx(): Promise<boolean> {
    try {
      const { stdout, stderr } = await execAsync('nginx -t');
      
      if (stderr && !stderr.includes('syntax is ok')) {
        Logger.error(`Nginx config test failed: ${stderr}`);
        return false;
      }
      
      await execAsync('nginx -s reload');
      return true;
    } catch (error) {
      Logger.error(`Error reloading Nginx: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  static async createDefaultTemplates(): Promise<void> {
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
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Project-ID {{projectId}};
    }
}`;

    await fs.writeFile(path.join(NGINX_TEMPLATES_DIR, 'domain.conf.template'), httpTemplate);
    await fs.writeFile(path.join(NGINX_TEMPLATES_DIR, 'ssl-domain.conf.template'), httpsTemplate);
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
}
