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
   * Create and execute a shell script with elevated privileges
   * @param scriptName Name of the script file
   * @param scriptContent Content of the script
   * @returns Result of script execution
   */
  static async createAndExecuteScript(scriptName: string, scriptContent: string): Promise<CommandResult> {
    try {
      if (!isProd) {
        Logger.info(`[PRIVILEGED_SCRIPT] Skipping script execution in non-production environment: ${scriptName}`);
        return { success: true, stdout: '', stderr: '' };
      }

      // Create a temporary script file
      const tempDir = '/tmp';
      const scriptPath = path.join(tempDir, scriptName);
      
      // Write script content to file
      await fs.writeFile(scriptPath, scriptContent, { mode: 0o755 });
      
      Logger.info(`[PRIVILEGED_SCRIPT] Created script: ${scriptPath}`);
      
      // Execute the script with sudo
      const { stdout, stderr } = await execAsync(`sudo bash "${scriptPath}"`);
      
      // Clean up the script file
      try {
        await fs.unlink(scriptPath);
      } catch (cleanupError) {
        Logger.warn(`[PRIVILEGED_SCRIPT] Failed to cleanup script ${scriptPath}: ${cleanupError}`);
      }
      
      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      };
    } catch (error: any) {
      Logger.error(`[PRIVILEGED_SCRIPT] Error executing script ${scriptName}: ${error.message}`);
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
      
      // Construct the setup script that calls the existing setup-domain.sh script
      const setupScript = `#!/bin/bash
echo "[SETUP_DOMAIN_SCRIPT] Setting up domain: ${domain}"
echo "[SETUP_DOMAIN_SCRIPT] Project ID: ${projectId}"
echo "[SETUP_DOMAIN_SCRIPT] Configure only: ${configureOnly}"

# Path to the setup-domain.sh script
SETUP_SCRIPT="/usr/local/bin/halogen-scripts/setup-domain.sh"

# Check if the setup script exists
if [ ! -f "\$SETUP_SCRIPT" ]; then
  # Try alternative location in the backend scripts directory
  SETUP_SCRIPT="${process.cwd()}/scripts/setup-domain.sh"
  if [ ! -f "\$SETUP_SCRIPT" ]; then
    echo "[SETUP_DOMAIN_SCRIPT] Error: setup-domain.sh script not found"
    exit 1
  fi
fi

# Make sure the script is executable
chmod +x "\$SETUP_SCRIPT"

# Build command arguments
ARGS="-d ${domain} -p ${projectId}"
if [ "${configureOnly}" = "true" ]; then
  ARGS="\$ARGS -c"
fi

echo "[SETUP_DOMAIN_SCRIPT] Executing: \$SETUP_SCRIPT \$ARGS"

# Execute the domain setup script
"\$SETUP_SCRIPT" \$ARGS

# Check the exit code
if [ \$? -eq 0 ]; then
  echo "[SETUP_DOMAIN_SCRIPT] Domain setup completed successfully for ${domain}"
  exit 0
else
  echo "[SETUP_DOMAIN_SCRIPT] Domain setup failed for ${domain}"
  exit 1
fi
`;

      Logger.info(`[SETUP_DOMAIN] Setting up domain ${domain} for project ${projectId} (configureOnly: ${configureOnly})`);
      
      // Execute the setup script
      const result = await this.createAndExecuteScript(
        `setup-domain-${domain}-${Date.now()}.sh`,
        setupScript
      );
      
      if (result.success) {
        Logger.info(`[SETUP_DOMAIN] Domain ${domain} setup completed successfully`);
      } else {
        Logger.error(`[SETUP_DOMAIN] Domain ${domain} setup failed: ${result.stderr}`);
      }
      
      return result;
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
}

export default PrivilegedCommandUtil;
