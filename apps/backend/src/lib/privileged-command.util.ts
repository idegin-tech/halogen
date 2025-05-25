import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import Logger from '../config/logger.config';
import { isProd, validateEnv } from '../config/env.config';

const execAsync = promisify(exec);
const env = validateEnv();

const SCRIPTS_DIR = '/home/msuser/nginx-configs';

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
   */
  static async executeCommand(command: string, args: string[] = []): Promise<CommandResult> {
    try {
      const fullCommand = `${command} ${args.join(' ')}`;
      Logger.info(`[PRIVILEGED_CMD_EXEC] Executing command: ${fullCommand}`);

      // Log environment information
      Logger.info(`[PRIVILEGED_CMD_EXEC] Current working directory: ${process.cwd()}`);
      Logger.info(`[PRIVILEGED_CMD_EXEC] Current user: ${process.env.USER || 'unknown'}`);

      // Check if the command exists
      try {
        const checkCommand = command.split('/').pop(); // Get the base command without path
        const { stdout: whichOutput } = await execAsync(`which ${checkCommand}`);
        Logger.info(`[PRIVILEGED_CMD_EXEC] Command ${checkCommand} found at: ${whichOutput.trim()}`);
      } catch (error) {
        const whichErr = error as Error;
        Logger.warn(`[PRIVILEGED_CMD_EXEC] Command check failed: ${whichErr.message}`);
      }

      // Execute the command
      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(fullCommand);
      const executionTime = Date.now() - startTime;

      Logger.info(`[PRIVILEGED_CMD_EXEC] Command executed in ${executionTime}ms`);
      Logger.info(`[PRIVILEGED_CMD_EXEC] Command stdout length: ${stdout.length} characters`);
      Logger.info(`[PRIVILEGED_CMD_EXEC] Command stdout: ${stdout}`);

      if (stderr && stderr.trim().length > 0) {
        Logger.warn(`[PRIVILEGED_CMD_EXEC] Command stderr length: ${stderr.length} characters`);
        Logger.warn(`[PRIVILEGED_CMD_EXEC] Command stderr: ${stderr}`);
      } else {
        Logger.info(`[PRIVILEGED_CMD_EXEC] No stderr output`);
      }

      const success = !stderr || stderr.trim().length === 0;

      // If this is a sudo command, log more details
      if (command === 'sudo') {
        Logger.info(`[PRIVILEGED_CMD_EXEC] Sudo command executed: ${args.join(' ')}`);

        // Check if the target of sudo exists
        if (args.length > 0) {
          const targetPath = args[0];
          try {
            const targetExists = await fs.pathExists(targetPath);
            Logger.info(`[PRIVILEGED_CMD_EXEC] Sudo target exists: ${targetExists}`);

            if (targetExists) {
              const stats = await fs.stat(targetPath);
              Logger.info(`[PRIVILEGED_CMD_EXEC] Sudo target permissions: ${stats.mode.toString(8)}`);
            }
          } catch (error) {
            const statErr = error as Error;
            Logger.error(`[PRIVILEGED_CMD_EXEC] Error checking sudo target: ${statErr.message}`);
          }
        }
      }

      return {
        success,
        stdout,
        stderr
      };
    } catch (error) {
      Logger.error(`[PRIVILEGED_CMD_EXEC] Error executing command ${command}: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Get more details about the error
      const errorDetails = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        // @ts-ignore
        code: error.code,
        // @ts-ignore
        signal: error.signal,
        // @ts-ignore
        cmd: error.cmd,
        // @ts-ignore
        stdout: error.stdout,
        // @ts-ignore
        stderr: error.stderr
      } : 'Unknown error';

      Logger.error(`[PRIVILEGED_CMD_EXEC] Error details: ${JSON.stringify(errorDetails)}`);

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
  static async createAndExecuteScript(scriptName: string, scriptContent: string): Promise<CommandResult> {
    try {
      Logger.info(`[PRIVILEGED_CMD] Creating script: ${scriptName}`);
      const scriptPath = await this.createScript(scriptName, scriptContent);
      Logger.info(`[PRIVILEGED_CMD] Script created at: ${scriptPath}`);

      // Check if script file actually exists
      const scriptExists = await fs.pathExists(scriptPath);
      Logger.info(`[PRIVILEGED_CMD] Script file exists: ${scriptExists}`);

      if (!scriptExists) {
        Logger.error(`[PRIVILEGED_CMD] Script file was not created at ${scriptPath}`);
        return {
          success: false,
          stdout: '',
          stderr: `Script file was not created at ${scriptPath}`,
          error: new Error(`Script file was not created at ${scriptPath}`)
        };
      }

      // Check the script content to make sure it was written correctly
      try {
        const actualContent = await fs.readFile(scriptPath, 'utf8');
        Logger.info(`[PRIVILEGED_CMD] Script content length: ${actualContent.length} characters`);
        const contentMatch = actualContent.length === scriptContent.length;
        Logger.info(`[PRIVILEGED_CMD] Script content length matches expected: ${contentMatch}`);
      } catch (error) {
        const readErr = error as Error;
        Logger.error(`[PRIVILEGED_CMD] Error reading script content: ${readErr.message}`);
      }

      // Make script executable
      try {
        await fs.chmod(scriptPath, '755');
        Logger.info(`[PRIVILEGED_CMD] Script permissions set to executable`);

        // Verify permissions were set
        const stats = await fs.stat(scriptPath);
        Logger.info(`[PRIVILEGED_CMD] Script file permissions: ${stats.mode.toString(8)}`);
      } catch (error) {
        const chmodErr = error as Error;
        Logger.error(`[PRIVILEGED_CMD] Error setting script permissions: ${chmodErr.message}`);
      }

      // In production, use sudo
      let command: string;
      let args: string[] = [];

      if (isProd) {
        Logger.info(`[PRIVILEGED_CMD] Running script with sudo`);
        command = 'sudo';
        args = [scriptPath];

        // Check if sudo is available
        try {
          const { stdout } = await execAsync('which sudo');
          Logger.info(`[PRIVILEGED_CMD] Sudo found at: ${stdout.trim()}`);
        } catch (error) {
          const sudoErr = error as Error;
          Logger.error(`[PRIVILEGED_CMD] Error checking sudo: ${sudoErr.message}`);
        }
      } else {
        Logger.info(`[PRIVILEGED_CMD] Running script directly (non-production)`);
        command = scriptPath;
      }

      Logger.info(`[PRIVILEGED_CMD] Executing script: ${command} ${args.join(' ')}`);
      const result = await this.executeCommand(command, args);

      Logger.info(`[PRIVILEGED_CMD] Script execution result: success=${result.success}`);
      Logger.info(`[PRIVILEGED_CMD] Script stdout: ${result.stdout}`);

      if (result.stderr) {
        Logger.error(`[PRIVILEGED_CMD] Script stderr: ${result.stderr}`);
      }

      // Log additional information about the script execution
      if (!result.success) {
        Logger.error(`[PRIVILEGED_CMD] Script execution failed for ${scriptName}`);

        // Check if the script exists after execution
        const scriptExistsAfter = await fs.pathExists(scriptPath);
        Logger.info(`[PRIVILEGED_CMD] Script file exists after execution: ${scriptExistsAfter}`);

        // Try to determine why sudo might have failed
        if (isProd) {
          try {
            // Check sudoers configuration (this might require sudo itself)
            const sudoersResult = await this.executeCommand('sudo', ['-l']);
            Logger.info(`[PRIVILEGED_CMD] Sudo permissions: ${sudoersResult.stdout}`);
          } catch (error) {
            const sudoersErr = error as Error;
            Logger.error(`[PRIVILEGED_CMD] Error checking sudo permissions: ${sudoersErr.message}`);
          }
        }
      }

      return result;
    } catch (error) {
      Logger.error(`[PRIVILEGED_CMD] Error executing script ${scriptName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
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
