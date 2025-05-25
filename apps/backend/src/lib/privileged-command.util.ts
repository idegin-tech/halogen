import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import { isProd } from '../config/env.config';
import Logger from '../config/logger.config';

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
      Logger.info(`Initialized ${NGINX_CONFIG_DIR} directory`);
      
      // Also ensure webroot directory is set up during initialization
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

      // Paths from sudoers NOPASSWD config
      const ALLOWED_NOPASSWD_COMMANDS = {
        cp: '/bin/cp',
        ln: '/bin/ln -s',
        rm: '/bin/rm',
        'nginx-test': '/usr/sbin/nginx -t',
        'nginx-reload': '/usr/sbin/nginx -s reload',
        certbot: '/usr/bin/certbot'
      };

      // Check if this is an allowed NOPASSWD command
      let cmdToExecute = '';
      if (command === 'cp' && args[0].startsWith(NGINX_CONFIG_DIR)) {
        cmdToExecute = `sudo ${ALLOWED_NOPASSWD_COMMANDS.cp} ${args.join(' ')}`;
      } else if (command === 'ln' && args.includes('-s') && args.some(arg => arg.startsWith(NGINX_SITES_AVAILABLE))) {
        cmdToExecute = `sudo ${ALLOWED_NOPASSWD_COMMANDS.ln} ${args.join(' ')}`;
      } else if (command === 'rm' && args.some(arg => arg.startsWith(NGINX_SITES_ENABLED))) {
        cmdToExecute = `sudo ${ALLOWED_NOPASSWD_COMMANDS.rm} ${args.join(' ')}`;
      } else if (command === 'nginx') {
        if (args.includes('-t')) {
          cmdToExecute = `sudo ${ALLOWED_NOPASSWD_COMMANDS['nginx-test']}`;
        } else if (args.includes('-s') && args.includes('reload')) {
          cmdToExecute = `sudo ${ALLOWED_NOPASSWD_COMMANDS['nginx-reload']}`;
        }
      } else if (command === 'certbot') {
        cmdToExecute = `sudo ${ALLOWED_NOPASSWD_COMMANDS.certbot} ${args.join(' ')}`;
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
    const configPath = path.join(NGINX_SITES_AVAILABLE, `${domain}.conf`);
    const enabledPath = path.join(NGINX_SITES_ENABLED, `${domain}.conf`);
    const localPath = path.join(NGINX_CONFIG_DIR, `${domain}.conf`);

    try {
      // Write config locally first
      await fs.writeFile(localPath, configContent);

      // Copy to sites-available
      await this.executeCommand('cp', [localPath, configPath]);

      // Create symlink in sites-enabled
      await this.executeCommand('ln', ['-s', configPath, enabledPath]);

      // Test nginx config
      const testResult = await this.executeCommand('nginx', ['-t']);
      if (!testResult.success) {
        // Cleanup on failure
        await this.executeCommand('rm', [enabledPath]);
        await this.executeCommand('rm', [configPath]);
        throw new Error(`Nginx config test failed: ${testResult.stderr}`);
      }

      // Reload nginx
      const reloadResult = await this.executeCommand('nginx', ['-s', 'reload']);
      if (!reloadResult.success) {
        throw new Error(`Nginx reload failed: ${reloadResult.stderr}`);
      }

      return {
        success: true,
        stdout: 'Nginx configuration deployed successfully',
        stderr: ''
      };
    } catch (error: any) {
      Logger.error(`Failed to deploy Nginx config for ${domain}: ${error.message}`);
      return {
        success: false,
        stdout: '',
        stderr: error.message,
        error
      };
    }
  }
  /**
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
      
      // Use direct command execution instead of shell scripts
      try {
        // Execute the setup-domain.sh script directly
        const setupScriptPath = path.join(process.cwd(), 'scripts', 'setup-domain.sh');
        const args = `-d ${domain} -p ${projectId}${configureOnly ? ' -c' : ''}`;
        
        const { stdout, stderr } = await execAsync(`bash "${setupScriptPath}" ${args}`);
        
        Logger.info(`[SETUP_DOMAIN] Domain ${domain} setup completed successfully`);
        
        return {
          success: true,
          stdout: stdout.trim(),
          stderr: stderr.trim()
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
