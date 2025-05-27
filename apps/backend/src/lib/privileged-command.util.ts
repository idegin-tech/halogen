import fs from 'fs-extra';
import { isProd } from '../config/env.config';
import Logger from '../config/logger.config';
import { SudoApiClient } from './sudo-api.client';

const NGINX_CONFIG_DIR = '/home/msuser/nginx-configs';

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  error?: Error;
}

/**
 * Utility class for executing privileged commands
 * Uses the Python API for elevated privileges
 */
export class PrivilegedCommandUtil {
  /**
   * Initialize the client
   */
  static async initialize(): Promise<void> {
    // Skip detailed initialization in non-production environments
    if (!isProd) {
      Logger.info('Skipping privileged command initialization in non-production environment');
      return;
    }

    try {
      // Check if Python API is healthy
      const health = await SudoApiClient.healthCheck();
      if (health.success) {
        Logger.info('Privileged command utility initialized - Python API is healthy');
      } else {
        Logger.warn('Privileged command utility initialized, but Python API health check failed');
      }
      
      // Create local directory for Nginx configs (these will be transferred to the server)
      await fs.mkdir(NGINX_CONFIG_DIR, { recursive: true });
      Logger.info(`Initialized ${NGINX_CONFIG_DIR} directory`);
      
      // Ensure webroot directory is set up during initialization through the Python API
      Logger.info('Setting up webroot directory during system initialization');
      const webrootResult = await this.ensureWebrootDirectory();
      if (webrootResult.success) {
        Logger.info('Webroot directory initialized successfully');
      } else {
        Logger.warn(`Webroot directory setup warning: ${webrootResult.stderr}`);
      }
    } catch (error) {
      Logger.error(`Failed to initialize privileged command utility: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute a privileged command using the Python API
   * @param command Command to execute
   * @param args Command arguments
   * @returns Result of command execution
   * @deprecated Use SudoApiClient directly instead
   */
  static async executeCommand(command: string, args: string[] = []): Promise<CommandResult> {
    try {
      if (!isProd) {
        Logger.info(`[PRIVILEGED_CMD] Skipping command in non-production environment: ${command} ${args.join(' ')}`);
        return { success: true, stdout: '', stderr: '' };
      }

      Logger.warn('PrivilegedCommandUtil.executeCommand is deprecated. Use SudoApiClient directly');
      
      // For backward compatibility, map common operations to API calls
      if (command === 'nginx' && args.includes('-s') && args.includes('reload')) {
        const result = await SudoApiClient.reloadNginx();
        return {
          success: result.success,
          stdout: result.message,
          stderr: result.error || ''
        };
      } else {
        Logger.error(`Unsupported command: ${command} ${args.join(' ')}`);
        return {
          success: false,
          stdout: '',
          stderr: `Unsupported command: ${command}. Use SudoApiClient directly.`
        };
      }
    } catch (error) {
      Logger.error(`[PRIVILEGED_CMD] Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Deploy Nginx configuration for a specific domain
   * @param domain Domain name
   * @param configContent Nginx configuration content
   * @returns Result of the deployment
   * @deprecated Use SudoApiClient.deployNginxConfig directly
   */
  static async deployNginxConfig(domain: string, configContent: string): Promise<CommandResult> {
    try {
      Logger.info(`[NGINX_DEPLOY] Deploying Nginx config for domain: ${domain}`);
      
      // Use the SudoApiClient directly instead of NginxSetupUtil
      const result = await SudoApiClient.deployNginxConfig({
        domain,
        project_id: 'nginx-config',
        ssl_enabled: configContent.includes('ssl_certificate'),
        config_content: configContent
      });
      
      return {
        success: result.success,
        stdout: result.message || '',
        stderr: result.error || ''
      };
    } catch (error) {
      Logger.error(`[NGINX_DEPLOY] Error deploying Nginx config for ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Set up a domain with Nginx configuration and optional SSL certificate
   * @param domain Domain name
   * @param projectId Project ID
   * @param options Configuration options
   * @returns Result of domain setup
   * @deprecated Use SudoApiClient.setupDomain directly
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
        // Call the Python API to set up the domain
        const result = await SudoApiClient.setupDomain({
          domain,
          project_id: projectId,
          ssl_enabled: !configureOnly,
          email: process.env.ADMIN_EMAIL || 'admin@example.com'
        });
        
        return {
          success: result.success,
          stdout: result.message || '',
          stderr: result.error || ''
        };
      } catch (setupError) {
        Logger.error(`[SETUP_DOMAIN] Domain ${domain} setup failed: ${setupError instanceof Error ? setupError.message : 'Unknown error'}`);
        return {
          success: false,
          stdout: '',
          stderr: setupError instanceof Error ? setupError.message : 'Unknown error',
          error: setupError instanceof Error ? setupError : new Error('Unknown error')
        };
      }
    } catch (error) {
      Logger.error(`[SETUP_DOMAIN] Error setting up domain ${domain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error : new Error('Unknown error')
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

      Logger.info(`[WEBROOT_SETUP] Ensuring webroot directory exists and has proper permissions via Python API`);
      
      // Use SudoApiClient.setupDomain which will ensure the webroot directory exists
      const result = await SudoApiClient.setupDomain({
        domain: 'webroot-setup',
        project_id: 'system',
        ssl_enabled: false,
        email: process.env.ADMIN_EMAIL || 'admin@example.com'
      });
      
      return {
        success: result.success,
        stdout: result.message || '',
        stderr: result.error || ''
      };
    } catch (error) {
      Logger.error(`[WEBROOT_SETUP] Error setting up webroot directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }
}

export default PrivilegedCommandUtil;
