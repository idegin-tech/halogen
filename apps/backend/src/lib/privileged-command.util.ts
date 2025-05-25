import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import Logger from '../config/logger.config';
import { isProd, validateEnv } from '../config/env.config';

const execAsync = promisify(exec);
const env = validateEnv();

const SCRIPTS_DIR = '/home/msuser/halogen-scripts';

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
   */  static async initialize(): Promise<void> {
    // Skip initialization in non-production environments
    if (!isProd) {
      Logger.info('Skipping privileged command scripts initialization in non-production environment');
      return;
    }

    try {
      await fs.ensureDir(SCRIPTS_DIR);
      Logger.info(`Privileged command scripts directory initialized at ${SCRIPTS_DIR}`);
    } catch (error) {
      Logger.error(`Failed to initialize privileged command scripts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Create a script with the given name and content in the scripts directory
   * @param scriptName Name of the script file
   * @param scriptContent Content of the script
   * @returns Path to the created script
   */  static async createScript(scriptName: string, scriptContent: string): Promise<string> {

    if (!isProd) {
      Logger.info(`Skipping script creation in non-production environment: ${scriptName}`);
      return `${SCRIPTS_DIR}/${scriptName}`;
    }

    try {
      const scriptPath = path.join(SCRIPTS_DIR, scriptName);
      await fs.writeFile(scriptPath, scriptContent);

      // Make script executable
      await execAsync(`chmod +x "${scriptPath}"`);

      return scriptPath;
    } catch (error) {
      Logger.error(`Failed to create script ${scriptName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Execute a privileged command using sudo if on Linux/Unix
   * @param command Command to execute
   * @param args Command arguments
   * @returns Result of command execution
   */  static async executeCommand(command: string, args: string[] = []): Promise<CommandResult> {
    // Skip execution in non-production environments
    if (!isProd) {
      Logger.info(`Skipping command execution in non-production environment: ${command} ${args.join(' ')}`);
      return {
        success: true,
        stdout: 'Command execution skipped in non-production environment',
        stderr: ''
      };
    }

    try {
      Logger.info(`Executing privileged command: ${command} ${args.join(' ')}`);

      // Use sudo for privileged execution
      const sudoCommand = `sudo ${command} ${args.join(' ')}`;
      const { stdout, stderr } = await execAsync(sudoCommand);
      return {
        success: true,
        stdout,
        stderr
      };
    } catch (error) {
      Logger.error(`Privileged command execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Execute a script with elevated privileges
   * @param scriptPath Path to the script
   * @param args Script arguments
   * @returns Result of script execution
   */
  static async executeScript(scriptPath: string, args: string[] = []): Promise<CommandResult> {
    return this.executeCommand(scriptPath, args);
  }

  /**
   * Creates and executes a privileged script
   * @param scriptName Name of the script
   * @param scriptContent Content of the script
   * @param args Arguments to pass to the script
   * @returns Result of script execution
   */
  static async createAndExecuteScript(scriptName: string, scriptContent: string, args: string[] = []): Promise<CommandResult> {
    const scriptPath = await this.createScript(scriptName, scriptContent);
    return this.executeScript(scriptPath, args);
  }

  /**
   * Set up a domain with Nginx configuration and SSL certificate
   * @param domain Domain name
   * @param projectId Project ID
   * @param options Additional options
   * @returns Result of domain setup
   */
  static async setupDomain(
    domain: string,
    projectId: string,
    options: { configureOnly?: boolean; renewCert?: boolean } = {}
  ): Promise<CommandResult> {
    try {
      const scriptPath = path.join(SCRIPTS_DIR, 'setup-domain.sh');
      const setupScriptExists = await fs.pathExists(scriptPath);

      if (!setupScriptExists) {
        // Copy script from our local scripts directory to the executable scripts directory
        const sourcePath = path.join(process.cwd(), 'scripts', 'setup-domain.sh');
        await fs.copy(sourcePath, scriptPath);
        await fs.chmod(scriptPath, 0o755); // Make executable
      }

      const args = [
        '-d', domain,
        '-p', projectId
      ];

      if (options.configureOnly) {
        args.push('-c');
      }

      if (options.renewCert) {
        args.push('-r');
      }

      // Add verbose flag for better logging
      args.push('-v');

      return this.executeScript(scriptPath, args);
    } catch (error) {
      Logger.error(`Domain setup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
