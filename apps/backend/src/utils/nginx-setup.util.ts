import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import Logger from '../config/logger.config';
import { isProd } from '../config/env.config';

const execAsync = promisify(exec);

export interface NginxSetupResult {
  success: boolean;
  message: string;
  stdout?: string;
  stderr?: string;
}

/**
 * Utility class for Nginx configuration management using pure Node.js
 * Replaces shell scripts with Node.js implementations
 */
export class NginxSetupUtil {
  private static readonly NGINX_SITES_AVAILABLE = '/etc/nginx/sites-available';
  private static readonly NGINX_SITES_ENABLED = '/etc/nginx/sites-enabled';
  private static readonly NGINX_CONFIG_DIR = '/home/msuser/nginx-configs';
  private static readonly NGINX_TEMPLATES_DIR = '/home/msuser/nginx-templates';

  /**
   * Check Nginx configuration and status
   */
  static async checkNginxConfig(): Promise<NginxSetupResult> {
    try {
      Logger.info('[NGINX_CHECK] Checking Nginx configuration and status');

      // Check if Nginx is installed
      try {
        const { stdout: version } = await execAsync('nginx -v');
        Logger.info(`[NGINX_CHECK] Nginx version: ${version}`);
      } catch (error) {
        return {
          success: false,
          message: 'Nginx is not installed',
          stderr: 'nginx command not found'
        };
      }

      // Test Nginx configuration
      const { stdout: testOutput, stderr: testError } = await execAsync('sudo nginx -t');
      Logger.info(`[NGINX_CHECK] Configuration test: ${testOutput || testError}`);

      // Check Nginx service status
      try {
        const { stdout: statusOutput } = await execAsync('sudo systemctl status nginx');
        Logger.info(`[NGINX_CHECK] Service status: active`);
      } catch (error) {
        Logger.warn(`[NGINX_CHECK] Service status check failed`);
      }

      return {
        success: true,
        message: 'Nginx configuration check completed',
        stdout: testOutput,
        stderr: testError
      };
    } catch (error: any) {
      Logger.error(`[NGINX_CHECK] Error checking Nginx: ${error.message}`);
      return {
        success: false,
        message: 'Failed to check Nginx configuration',
        stderr: error.message
      };
    }
  }

  /**
   * Generate Nginx configuration for a domain
   */
  static generateNginxConfig(domain: string, projectId: string, ssl: boolean = false): string {
    if (ssl) {
      return `server {
    listen 80;
    server_name ${domain};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${domain};
    
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Project-ID ${projectId};
        
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
    } else {
      return `server {
    listen 80;
    server_name ${domain};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Project-ID ${projectId};
        
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
    }
  }

  static async deployNginxConfig(domain: string, configContent: string): Promise<NginxSetupResult> {
    try {
      if (!isProd) {
        Logger.info(`[NGINX_DEPLOY] Skipping Nginx deployment in non-production environment for ${domain}`);
        return { success: true, message: 'Skipped in non-production' };
      }

      const configPath = path.join(this.NGINX_SITES_AVAILABLE, `${domain}.conf`);
      const enabledPath = path.join(this.NGINX_SITES_ENABLED, `${domain}.conf`);
      const localPath = path.join(this.NGINX_CONFIG_DIR, `${domain}.conf`);

      await fs.writeFile(localPath, configContent);
      Logger.info(`[NGINX_DEPLOY] Written config to ${localPath}`);

      // Copy to sites-available
      await execAsync(`sudo cp ${localPath} ${configPath}`);
      Logger.info(`[NGINX_DEPLOY] Copied config to sites-available`);

      // Create symlink in sites-enabled (remove existing first)
      try {
        await execAsync(`sudo rm -f ${enabledPath}`);
      } catch (error) {
        // Ignore error if file doesn't exist
      }
      
      await execAsync(`sudo ln -s ${configPath} ${enabledPath}`);
      Logger.info(`[NGINX_DEPLOY] Created symlink in sites-enabled`);

      // Test nginx config
      const { stderr: testError } = await execAsync('sudo nginx -t');
      if (testError && testError.includes('test failed')) {
        // Cleanup on failure
        await execAsync(`sudo rm -f ${enabledPath}`);
        await execAsync(`sudo rm -f ${configPath}`);
        throw new Error(`Nginx config test failed: ${testError}`);
      }

      // Reload nginx
      await execAsync('sudo nginx -s reload');
      Logger.info(`[NGINX_DEPLOY] Nginx reloaded successfully`);

      return {
        success: true,
        message: `Nginx configuration deployed successfully for ${domain}`
      };
    } catch (error: any) {
      Logger.error(`[NGINX_DEPLOY] Failed to deploy config for ${domain}: ${error.message}`);
      return {
        success: false,
        message: `Failed to deploy Nginx configuration for ${domain}`,
        stderr: error.message
      };
    }
  }

  /**
   * Check if domain is already configured in Nginx
   */
  static async isDomainConfigured(domain: string): Promise<boolean> {
    try {
      const configPath = path.join(this.NGINX_SITES_AVAILABLE, `${domain}.conf`);
      await fs.access(configPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Remove domain configuration from Nginx
   */
  static async removeDomainConfig(domain: string): Promise<NginxSetupResult> {
    try {
      if (!isProd) {
        Logger.info(`[NGINX_REMOVE] Skipping domain removal in non-production environment for ${domain}`);
        return { success: true, message: 'Skipped in non-production' };
      }

      const configPath = path.join(this.NGINX_SITES_AVAILABLE, `${domain}.conf`);
      const enabledPath = path.join(this.NGINX_SITES_ENABLED, `${domain}.conf`);
      const localPath = path.join(this.NGINX_CONFIG_DIR, `${domain}.conf`);

      // Remove symlink from sites-enabled
      try {
        await execAsync(`sudo rm -f ${enabledPath}`);
        Logger.info(`[NGINX_REMOVE] Removed symlink from sites-enabled`);
      } catch (error) {
        Logger.warn(`[NGINX_REMOVE] Could not remove symlink: ${error}`);
      }

      // Remove config from sites-available
      try {
        await execAsync(`sudo rm -f ${configPath}`);
        Logger.info(`[NGINX_REMOVE] Removed config from sites-available`);
      } catch (error) {
        Logger.warn(`[NGINX_REMOVE] Could not remove config: ${error}`);
      }

      // Remove local config
      try {
        await fs.unlink(localPath);
        Logger.info(`[NGINX_REMOVE] Removed local config file`);
      } catch (error) {
        Logger.warn(`[NGINX_REMOVE] Could not remove local config: ${error}`);
      }

      // Test and reload nginx
      await execAsync('sudo nginx -t');
      await execAsync('sudo nginx -s reload');
      Logger.info(`[NGINX_REMOVE] Nginx reloaded successfully`);

      return {
        success: true,
        message: `Domain ${domain} configuration removed successfully`
      };
    } catch (error: any) {
      Logger.error(`[NGINX_REMOVE] Failed to remove config for ${domain}: ${error.message}`);
      return {
        success: false,
        message: `Failed to remove configuration for ${domain}`,
        stderr: error.message
      };
    }
  }
}

export default NginxSetupUtil;
