import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import { isProd } from '../config/env.config';
import Logger from '../config/logger.config';
import { NginxSetupUtil } from '../utils/nginx-setup.util';
import { SSLSetupUtil } from '../utils/ssl-setup.util';
import { SystemPermissionsUtil } from '../utils/system-permissions.util';
import { SudoersUtil } from '../utils/sudoers.util';

const execAsync = promisify(exec);

const NGINX_CONFIG_DIR = '/home/msuser/nginx-configs';
const NGINX_SITES_AVAILABLE = '/etc/nginx/sites-available';
const NGINX_SITES_ENABLED = '/etc/nginx/sites-enabled';

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  error?: Error;
}

/**
 * Utility class for executing privileged commands
 * Uses a secure approach to execute system commands with elevated privileges
 */
export class PrivilegedCommandUtil {  /**
   * Initialize the script directory and ensure it exists
   */
  static async initialize(): Promise<void> {
    // Skip initialization in non-production environments
    if (!isProd) {
      Logger.info('Skipping privileged command scripts initialization in non-production environment');
      return;
    }

    try {
      await fs.mkdir(NGINX_CONFIG_DIR, { recursive: true });
      console.log(`\n\n\n\n ============= DOMAIN CONFIG STARTED ==============`)
      Logger.info(`Initialized ${NGINX_CONFIG_DIR} directory`);
      
      // Set up required directories using SystemPermissionsUtil
      Logger.info('Setting up required system directories');
      const dirSetupResult = await SystemPermissionsUtil.setupRequiredDirectories();
      if (dirSetupResult.success) {
        Logger.info(`System directories set up successfully: ${dirSetupResult.createdDirectories.length} directories`);
      } else {
        Logger.warn(`Directory setup completed with warnings: ${dirSetupResult.errors.join(', ')}`);
      }

      // Check and update sudoers configuration
      Logger.info('Checking sudoers configuration');
      const sudoersCheck = await SudoersUtil.checkSudoersConfiguration();
      if (!sudoersCheck.isValid) {
        Logger.warn('Sudoers configuration needs to be updated');
        const sudoersUpdate = await SudoersUtil.updateSudoersConfiguration();
        if (sudoersUpdate.success) {
          Logger.info('Sudoers configuration updated successfully');
        } else {
          Logger.error(`Failed to update sudoers: ${sudoersUpdate.errors.join(', ')}`);
        }
      }

      // Ensure webroot directory is set up during initialization
      Logger.info('Setting up webroot directory during system initialization');
      const webrootResult = await this.ensureWebrootDirectory();
      if (webrootResult.success) {
        Logger.info('Webroot directory initialized successfully');
      } else {
        Logger.warn(`Webroot directory setup warning: ${webrootResult.stderr}`);
      }
    } catch (error) {
      Logger.error(`Failed to initialize directories: ${error}`);
      throw error;
    }
  }
  /**
   * Execute a privileged command using sudo if on Linux/Unix
   * @param command Command to execute
   * @param args Command arguments
   * @returns Result of command execution
   */
  static async executeCommand(command: string, args: string[] = []): Promise<CommandResult> {
    try {
      if (!isProd) {
        Logger.info(`[PRIVILEGED_CMD] Skipping command in non-production environment: ${command} ${args.join(' ')}`);
        return { success: true, stdout: '', stderr: '' };
      }

      // Check if this is an allowed NOPASSWD command
      let cmdToExecute = '';
      
      if (command === 'cp' && args[0]?.startsWith(NGINX_CONFIG_DIR)) {
        cmdToExecute = `sudo /bin/cp ${args.join(' ')}`;
      } else if (command === 'ln' && args.includes('-s') && args.some(arg => arg.startsWith(NGINX_SITES_AVAILABLE))) {
        // Remove duplicate -s if present
        const filteredArgs = args.filter((arg, index) => !(arg === '-s' && index > 0 && args[index - 1] === '-s'));
        cmdToExecute = `sudo /bin/ln ${filteredArgs.join(' ')}`;
      } else if (command === 'rm' && args.some(arg => arg.startsWith(NGINX_SITES_ENABLED))) {
        cmdToExecute = `sudo /bin/rm ${args.join(' ')}`;
      } else if (command === 'nginx') {
        if (args.includes('-t')) {
          cmdToExecute = `sudo /usr/sbin/nginx -t`;
        } else if (args.includes('-s') && args.includes('reload')) {
          cmdToExecute = `sudo /usr/sbin/nginx -s reload`;
        }
      } else if (command === 'certbot') {
        cmdToExecute = `sudo /usr/bin/certbot ${args.join(' ')}`;
      } else if (command === 'systemctl') {
        if (args.includes('is-active') && args.includes('nginx')) {
          cmdToExecute = `sudo /bin/systemctl is-active --quiet nginx`;
        } else if (args.includes('status') && args.includes('nginx')) {
          cmdToExecute = `sudo /bin/systemctl status nginx`;
        }
      } else if (command === 'ls' && args.includes('/etc/nginx/sites-enabled/')) {
        cmdToExecute = `sudo /bin/ls -la /etc/nginx/sites-enabled/`;
      } else if (command === 'mkdir' && args.some(arg => arg.includes('/var/www/certbot'))) {
        cmdToExecute = `sudo /bin/mkdir ${args.join(' ')}`;
      } else if (command === 'chmod' && args.some(arg => arg.includes('/var/www/certbot'))) {
        cmdToExecute = `sudo /bin/chmod ${args.join(' ')}`;
      } else if (command === 'chown' && args.some(arg => arg.includes('/var/www/certbot'))) {
        cmdToExecute = `sudo /bin/chown ${args.join(' ')}`;
      } else if (command === 'echo' && args.some(arg => arg.includes('/var/www/certbot'))) {
        cmdToExecute = `sudo /bin/echo ${args.join(' ')}`;
      } else if (command === 'tee' && args.some(arg => arg.includes('/var/www/certbot'))) {
        cmdToExecute = `sudo /usr/bin/tee ${args.join(' ')}`;
      } else if (command.startsWith('sudo mkdir -p /var/www/certbot')) {
        cmdToExecute = command; // Already has sudo prefix
      } else if (command.startsWith('sudo chmod') && command.includes('/var/www/certbot')) {
        cmdToExecute = command; // Already has sudo prefix
      } else if (command.startsWith('sudo rm -f') && command.includes('/var/www/certbot')) {
        cmdToExecute = command; // Already has sudo prefix
      } else if (command.startsWith('echo') && command.includes('sudo tee')) {
        cmdToExecute = command; // Complex command with pipe
      }

      if (!cmdToExecute) {
        throw new Error(`Command not in NOPASSWD list: ${command} ${args.join(' ')}`);
      }

      Logger.info(`[PRIVILEGED_CMD] Executing: ${cmdToExecute}`);
      const { stdout, stderr } = await execAsync(cmdToExecute);
      
      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      };
    } catch (error: any) {
      Logger.error(`[PRIVILEGED_CMD] Error executing command: ${error.message}`);
      return {
        success: false,
        stdout: '',
        stderr: error.message,
        error
      };
    }
  }
  /**
   * Deploy Nginx configuration for a specific domain
   * @param domain Domain name
   * @param configContent Nginx configuration content
   * @returns Result of the deployment
   */
  static async deployNginxConfig(domain: string, configContent: string): Promise<CommandResult> {
    try {
      Logger.info(`[NGINX_DEPLOY] Deploying Nginx config for domain: ${domain}`);
      
      // Use the new NginxSetupUtil instead of direct command execution
      const result = await NginxSetupUtil.deployNginxConfig(domain, configContent);
        return {
        success: result.success,
        stdout: result.stdout || '',
        stderr: result.stderr || ''
      };

    } catch (error: any) {
      Logger.error(`[NGINX_DEPLOY] Error deploying Nginx config for ${domain}: ${error.message}`);
      return {
        success: false,
        stdout: '',
        stderr: error.message,
        error
      };
    }
  }  /**
   * Set up a domain with Nginx configuration and optional SSL certificate
   * @param domain Domain name
   * @param projectId Project ID
   * @param options Configuration options
   * @returns Result of domain setup
   */
  static async setupDomain(domain: string, projectId: string, options?: { configureOnly?: boolean }): Promise<CommandResult> {
    try {
      if (!isProd) {
        Logger.info(`[SETUP_DOMAIN] Skipping domain setup in non-production environment: ${domain}`);
        return { success: true, stdout: '', stderr: '' };
      }

      const configureOnly = options?.configureOnly || false;
      
      Logger.info(`[SETUP_DOMAIN] Setting up domain ${domain} for project ${projectId} (configureOnly: ${configureOnly})`);
      
      try {
        // Ensure webroot directory exists with proper permissions
        const webrootResult = await this.ensureWebrootDirectory();
        if (!webrootResult.success) {
          Logger.warn(`[SETUP_DOMAIN] Webroot setup warning: ${webrootResult.stderr}`);
        }        // Check if domain is already configured
        const isDomainConfigured = await NginxSetupUtil.isDomainConfigured(domain);
        if (isDomainConfigured) {
          Logger.info(`[SETUP_DOMAIN] Domain ${domain} is already configured`);
        }

        // Set up SSL certificate if not in configure-only mode
        if (!configureOnly) {
          Logger.info(`[SETUP_DOMAIN] Setting up SSL certificate for domain ${domain}`);
          const sslResult = await SSLSetupUtil.generateSSLCertificate(domain);
          if (!sslResult.success) {
            Logger.warn(`[SETUP_DOMAIN] SSL setup failed for ${domain}: ${sslResult.message}`);
          } else {
            Logger.info(`[SETUP_DOMAIN] SSL certificate generated successfully for ${domain}`);
          }
        }
        
        Logger.info(`[SETUP_DOMAIN] Domain ${domain} setup completed successfully`);
        
        return {
          success: true,
          stdout: 'Domain setup completed using Node.js commands',
          stderr: ''
        };
      } catch (error: any) {
        Logger.error(`[SETUP_DOMAIN] Domain ${domain} setup failed: ${error.message}`);
        return {
          success: false,
          stdout: '',
          stderr: error.message,
          error
        };
      }
    } catch (error: any) {
      Logger.error(`[SETUP_DOMAIN] Error setting up domain ${domain}: ${error.message}`);
      return {
        success: false,
        stdout: '',
        stderr: error.message,
        error
      };
    }
  }
  /**
   * Ensure the webroot directory exists and has proper permissions for Certbot challenges
   * @returns Result of webroot directory setup
   */
  static async ensureWebrootDirectory(): Promise<CommandResult> {
    try {
      if (!isProd) {
        Logger.info(`[WEBROOT_SETUP] Skipping webroot setup in non-production environment`);
        return { success: true, stdout: '', stderr: '' };
      }

      Logger.info(`[WEBROOT_SETUP] Ensuring webroot directory exists and has proper permissions`);

      // Create directories using Node.js fs instead of shell scripts
      try {
        // Create the main webroot directory
        await fs.mkdir('/var/www/certbot', { recursive: true });
        Logger.info(`[WEBROOT_SETUP] Created/verified webroot directory: /var/www/certbot`);

        // Create .well-known/acme-challenge directory
        await fs.mkdir('/var/www/certbot/.well-known/acme-challenge', { recursive: true });
        Logger.info(`[WEBROOT_SETUP] Created/verified ACME challenge directory: /var/www/certbot/.well-known/acme-challenge`);

        // Set proper ownership and permissions using individual commands
        const chownResult = await execAsync('sudo chown -R www-data:www-data /var/www/certbot');
        if (chownResult.stderr) {
          Logger.warn(`[WEBROOT_SETUP] chown warning: ${chownResult.stderr}`);
        }

        const chmodResult = await execAsync('sudo chmod -R 755 /var/www/certbot');
        if (chmodResult.stderr) {
          Logger.warn(`[WEBROOT_SETUP] chmod warning: ${chmodResult.stderr}`);
        }

        Logger.info(`[WEBROOT_SETUP] Webroot directory setup completed successfully`);
        
        return {
          success: true,
          stdout: 'Webroot directory setup completed successfully',
          stderr: ''
        };
      } catch (fsError: any) {
        // If Node.js mkdir fails due to permissions, fall back to direct commands
        Logger.warn(`[WEBROOT_SETUP] Node.js mkdir failed, using sudo commands: ${fsError.message}`);
        
        const mkdirResult = await execAsync('sudo mkdir -p /var/www/certbot/.well-known/acme-challenge');
        const chownResult = await execAsync('sudo chown -R www-data:www-data /var/www/certbot');
        const chmodResult = await execAsync('sudo chmod -R 755 /var/www/certbot');

        return {
          success: true,
          stdout: 'Webroot directory setup completed successfully (using sudo)',
          stderr: mkdirResult.stderr + chownResult.stderr + chmodResult.stderr
        };
      }
    } catch (error: any) {
      Logger.error(`[WEBROOT_SETUP] Error setting up webroot directory: ${error.message}`);
      return {
        success: false,
        stdout: '',
        stderr: error.message,
        error
      };
    }
  }
}

export default PrivilegedCommandUtil;
