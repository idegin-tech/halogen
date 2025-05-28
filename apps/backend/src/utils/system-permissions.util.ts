import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { isProd } from '../config/env.config';
import Logger from '../config/logger.config';

const execAsync = promisify(exec);

export interface PermissionCheckResult {
  success: boolean;
  message: string;
  details: string[];
  errors: string[];
}

export interface DirectorySetupResult {
  success: boolean;
  message: string;
  createdDirectories: string[];
  details: string[];
  errors: string[];
}

export interface SudoPermissionInfo {
  hasAccess: boolean;
  allowedCommands: string[];
  restrictions: string[];
}

export class SystemPermissionsUtil {
  private static readonly REQUIRED_DIRECTORIES = [
    '/home/msuser/halogen-scripts',
    '/home/msuser/.letsencrypt',
    '/home/msuser/nginx-templates',
    '/home/msuser/nginx-configs'
  ];

  private static readonly NGINX_DIRS = [
    '/etc/nginx/sites-available',
    '/etc/nginx/sites-enabled'
  ];

  static async checkSudoPermissions(username: string = 'msuser'): Promise<PermissionCheckResult> {
    const result: PermissionCheckResult = {
      success: false,
      message: '',
      details: [],
      errors: []
    };

    try {
      if (!isProd) {
        Logger.info(`[SUDO_CHECK] Skipping sudo permission check in non-production environment`);
        result.success = true;
        result.message = 'Skipped sudo permission check in non-production environment';
        return result;
      }

      Logger.info(`[SUDO_CHECK] Checking sudo permissions for user: ${username}`);

      // Check if user exists
      if (!(await this.userExists(username))) {
        result.errors.push(`User ${username} does not exist`);
        result.message = `User ${username} does not exist`;
        return result;
      }

      // Check sudoers.d configuration
      await this.checkSudoersConfig(username, result);

      // Check Nginx permissions
      await this.checkNginxPermissions(username, result);

      // Check local config directories
      await this.checkLocalConfigDirectories(username, result);

      // Check script permissions
      await this.checkScriptPermissions(username, result);

      result.success = result.errors.length === 0;
      result.message = result.success 
        ? `Sudo permissions verified successfully for ${username}`
        : `Sudo permission issues found for ${username}`;

      if (result.success) {
        Logger.info(`[SUDO_CHECK] All permission checks passed for ${username}`);
      } else {
        Logger.warn(`[SUDO_CHECK] Permission issues found for ${username}: ${result.errors.length} errors`);
      }

    } catch (error: any) {
      Logger.error(`[SUDO_CHECK] Error checking sudo permissions: ${error.message}`);
      result.errors.push(`Error checking sudo permissions: ${error.message}`);
      result.message = `Error checking sudo permissions: ${error.message}`;
    }

    return result;
  }

  /**
   * Create necessary directories with proper permissions
   */
  static async setupRequiredDirectories(): Promise<DirectorySetupResult> {    const result: DirectorySetupResult = {
      success: false,
      message: '',
      createdDirectories: [],
      details: [],
      errors: []
    };

    try {
      if (!isProd) {
        Logger.info(`[DIR_SETUP] Skipping directory setup in non-production environment`);
        result.success = true;
        result.message = 'Skipped directory setup in non-production environment';
        return result;
      }

      Logger.info(`[DIR_SETUP] Setting up required directories with proper permissions`);

      for (const dirPath of this.REQUIRED_DIRECTORIES) {
        try {
          // Create directory
          await execAsync(`sudo mkdir -p ${dirPath}`);
          
          // Set permissions
          await execAsync(`sudo chmod 755 ${dirPath}`);
          
          // Set ownership to msuser
          await execAsync(`sudo chown msuser:msuser ${dirPath}`);
          
          result.createdDirectories.push(dirPath);
          result.details.push(`✓ Created/verified directory: ${dirPath}`);
          
          Logger.info(`[DIR_SETUP] Set up directory: ${dirPath}`);
          
        } catch (error: any) {
          const errorMsg = `Failed to setup directory ${dirPath}: ${error.message}`;
          result.errors.push(errorMsg);
          Logger.error(`[DIR_SETUP] ${errorMsg}`);
        }
      }

      // Setup webroot directory for Certbot
      try {
        await execAsync('sudo mkdir -p /var/www/certbot/.well-known/acme-challenge');
        await execAsync('sudo chown -R www-data:www-data /var/www/certbot');
        await execAsync('sudo chmod -R 755 /var/www/certbot');
        
        result.createdDirectories.push('/var/www/certbot');
        result.details.push('✓ Created/verified webroot directory for Certbot');
        Logger.info(`[DIR_SETUP] Set up Certbot webroot directory`);
        
      } catch (error: any) {
        const errorMsg = `Failed to setup Certbot webroot directory: ${error.message}`;
        result.errors.push(errorMsg);
        Logger.error(`[DIR_SETUP] ${errorMsg}`);
      }

      result.success = result.errors.length === 0;
      result.message = result.success 
        ? `Successfully set up ${result.createdDirectories.length} directories`
        : `Directory setup completed with ${result.errors.length} errors`;

    } catch (error: any) {
      Logger.error(`[DIR_SETUP] Error setting up directories: ${error.message}`);
      result.errors.push(`Error setting up directories: ${error.message}`);
      result.message = `Error setting up directories: ${error.message}`;
    }

    return result;
  }

  /**
   * Get sudo permission information for a user
   */
  static async getSudoPermissionInfo(username: string = 'msuser'): Promise<SudoPermissionInfo> {
    const info: SudoPermissionInfo = {
      hasAccess: false,
      allowedCommands: [],
      restrictions: []
    };

    try {
      if (!isProd) {
        info.hasAccess = true;
        info.allowedCommands.push('All commands (non-production environment)');
        return info;
      }

      // Check sudo permissions
      const sudoResult = await execAsync(`sudo -l -U ${username}`);
      const sudoOutput = sudoResult.stdout + sudoResult.stderr;
      
      if (sudoOutput.includes('may run the following commands')) {
        info.hasAccess = true;
        
        // Parse allowed commands
        const lines = sudoOutput.split('\n');
        for (const line of lines) {
          if (line.includes('NOPASSWD:')) {
            const command = line.split('NOPASSWD:')[1]?.trim();
            if (command) {
              info.allowedCommands.push(command);
            }
          }
        }
      }

    } catch (error: any) {
      info.restrictions.push(`Cannot check sudo permissions: ${error.message}`);
    }

    return info;
  }

  /**
   * Test if a user can perform required operations
   */
  static async testUserOperations(username: string = 'msuser'): Promise<PermissionCheckResult> {
    const result: PermissionCheckResult = {
      success: false,
      message: '',
      details: [],
      errors: []
    };

    try {
      if (!isProd) {
        result.success = true;
        result.message = 'Skipped user operation tests in non-production environment';
        return result;
      }

      Logger.info(`[USER_TEST] Testing user operations for: ${username}`);

      // Test writing to Nginx directories
      try {
        const testFile = '/etc/nginx/sites-available/test-file.conf';
        await execAsync(`sudo -u ${username} touch ${testFile}`);
        await execAsync(`sudo rm -f ${testFile}`);
        result.details.push(`✓ User ${username} can write to sites-available`);
      } catch (error) {
        result.errors.push(`✗ User ${username} CANNOT write to sites-available`);
      }

      // Test creating symlinks in sites-enabled
      try {
        const testLink = '/etc/nginx/sites-enabled/test-link';
        await execAsync(`sudo -u ${username} ln -sf /etc/nginx/sites-available/default ${testLink}`);
        await execAsync(`sudo rm -f ${testLink}`);
        result.details.push(`✓ User ${username} can create symlinks in sites-enabled`);
      } catch (error) {
        result.errors.push(`✗ User ${username} CANNOT create symlinks in sites-enabled`);
      }

      result.success = result.errors.length === 0;
      result.message = result.success 
        ? `All user operation tests passed for ${username}`
        : `User operation tests failed for ${username}`;

    } catch (error: any) {
      result.errors.push(`Error testing user operations: ${error.message}`);
      result.message = `Error testing user operations: ${error.message}`;
    }

    return result;
  }

  // Private helper methods

  private static async userExists(username: string): Promise<boolean> {
    try {
      await execAsync(`id ${username}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  private static async checkSudoersConfig(username: string, result: PermissionCheckResult): Promise<void> {
    try {
      // Check sudoers.d directory
      const sudoersDirExists = await fs.access('/etc/sudoers.d').then(() => true).catch(() => false);
      
      if (sudoersDirExists) {
        result.details.push('✓ Sudoers.d directory exists');
        
        // List files in sudoers.d
        const sudoersFiles = await fs.readdir('/etc/sudoers.d');
        result.details.push(`Sudoers.d files: ${sudoersFiles.join(', ')}`);
        
        // Check for user-specific files
        const userFiles = sudoersFiles.filter(file => file.includes(username));
        if (userFiles.length > 0) {
          result.details.push(`✓ Found sudoers files for ${username}: ${userFiles.join(', ')}`);
        } else {
          result.errors.push(`No sudoers files found for ${username}`);
        }
        
      } else {
        result.errors.push('Sudoers.d directory does not exist');
      }

      // Check main sudoers file
      try {
        const sudoersContent = await execAsync(`sudo grep ${username} /etc/sudoers`);
        if (sudoersContent.stdout.trim()) {
          result.details.push(`✓ Found entries for ${username} in main sudoers file`);
        }
      } catch (error) {
        result.details.push(`No entries found for ${username} in main sudoers file`);
      }

      // Check actual sudo permissions
      try {
        const sudoCheck = await execAsync(`sudo -l -U ${username}`);
        result.details.push(`✓ Sudo permissions verified for ${username}`);
      } catch (error: any) {
        result.errors.push(`Failed to get sudo permissions for ${username}: ${error.message}`);
      }

    } catch (error: any) {
      result.errors.push(`Error checking sudoers configuration: ${error.message}`);
    }
  }

  private static async checkNginxPermissions(username: string, result: PermissionCheckResult): Promise<void> {
    try {
      for (const nginxDir of this.NGINX_DIRS) {
        const dirExists = await fs.access(nginxDir).then(() => true).catch(() => false);
        
        if (dirExists) {
          result.details.push(`✓ Nginx directory exists: ${nginxDir}`);
          
          // Check ownership and permissions
          try {
            const statResult = await execAsync(`stat -c "%U:%G %a" ${nginxDir}`);
            result.details.push(`${nginxDir} ownership/permissions: ${statResult.stdout.trim()}`);
          } catch (error) {
            result.errors.push(`Could not get ownership/permissions for ${nginxDir}`);
          }
          
        } else {
          result.errors.push(`Nginx directory does not exist: ${nginxDir}`);
        }
      }
    } catch (error: any) {
      result.errors.push(`Error checking Nginx permissions: ${error.message}`);
    }
  }

  private static async checkLocalConfigDirectories(username: string, result: PermissionCheckResult): Promise<void> {
    try {
      for (const dirPath of this.REQUIRED_DIRECTORIES) {
        const dirExists = await fs.access(dirPath).then(() => true).catch(() => false);
        
        if (dirExists) {
          result.details.push(`✓ Local directory exists: ${dirPath}`);
          
          // Check ownership and permissions
          try {
            const statResult = await execAsync(`stat -c "%U:%G %a" ${dirPath}`);
            result.details.push(`${dirPath} ownership/permissions: ${statResult.stdout.trim()}`);
          } catch (error) {
            result.errors.push(`Could not get ownership/permissions for ${dirPath}`);
          }
          
          // Check if directory has content (for nginx-configs and nginx-templates)
          if (dirPath.includes('nginx-')) {
            try {
              const files = await fs.readdir(dirPath);
              if (files.length > 0) {
                result.details.push(`${dirPath} contains ${files.length} files`);
              } else {
                result.details.push(`${dirPath} is empty`);
              }
            } catch (error) {
              result.errors.push(`Could not read directory contents: ${dirPath}`);
            }
          }
          
        } else {
          result.errors.push(`Local directory does not exist: ${dirPath}`);
        }
      }
    } catch (error: any) {
      result.errors.push(`Error checking local config directories: ${error.message}`);
    }
  }

  private static async checkScriptPermissions(username: string, result: PermissionCheckResult): Promise<void> {
    try {
      const scriptsDir = `/home/${username}/halogen-scripts`;
      const scriptsDirExists = await fs.access(scriptsDir).then(() => true).catch(() => false);
      
      if (scriptsDirExists) {
        result.details.push(`✓ Scripts directory exists: ${scriptsDir}`);
        
        // Check ownership and permissions
        try {
          const statResult = await execAsync(`stat -c "%U:%G %a" ${scriptsDir}`);
          result.details.push(`${scriptsDir} ownership/permissions: ${statResult.stdout.trim()}`);
        } catch (error) {
          result.errors.push(`Could not get ownership/permissions for ${scriptsDir}`);
        }
          // Shell scripts have been migrated to Node.js utilities
        result.details.push(`Shell script migration complete - using Node.js utilities`);
        
      } else {
        result.errors.push(`Scripts directory does not exist: ${scriptsDir}`);
      }
    } catch (error: any) {
      result.errors.push(`Error checking script permissions: ${error.message}`);
    }
  }
}
