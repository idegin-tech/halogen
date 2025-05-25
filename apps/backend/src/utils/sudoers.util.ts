import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import { isProd } from '../config/env.config';
import Logger from '../config/logger.config';

const execAsync = promisify(exec);

export interface SudoersUpdateResult {
  success: boolean;
  message: string;
  backupCreated?: string;
  commandsAdded: string[];
  errors: string[];
}

export interface SudoersValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Utility class for sudoers configuration management using pure Node.js
 * Replaces update-sudoers.sh functionality
 */
export class SudoersUtil {
  private static readonly SUDOERS_FILE = '/etc/sudoers.d/msuser';
  
  private static readonly REQUIRED_COMMANDS = [
    // Nginx configuration management
    '/bin/cp /home/msuser/nginx-configs/* /etc/nginx/sites-available/',
    '/bin/ln -s /etc/nginx/sites-available/* /etc/nginx/sites-enabled/',
    '/bin/rm /etc/nginx/sites-enabled/*',
    '/usr/sbin/nginx -t',
    '/usr/sbin/nginx -s reload',
    
    // Certbot SSL certificate management
    '/usr/bin/certbot',
    
    // Webroot directory management for SSL challenges
    '/bin/mkdir -p /var/www/certbot',
    '/bin/mkdir -p /var/www/certbot*',
    '/bin/mkdir -p /var/www/certbot/.well-known/acme-challenge',
    '/bin/chown -R www-data\\:www-data /var/www/certbot',
    '/bin/chown -R www-data\\:www-data /var/www/certbot*',
    '/bin/chmod -R 755 /var/www/certbot',
    '/bin/chmod -R 755 /var/www/certbot*',
    '/bin/chmod 644 /var/www/certbot/.well-known/acme-challenge/*',
    '/bin/chmod * /var/www/certbot*',
    
    // File operations for SSL challenges
    '/bin/echo * | /usr/bin/tee /var/www/certbot/.well-known/acme-challenge/*',
    '/bin/echo * | /usr/bin/tee /var/www/certbot*',
    '/usr/bin/tee /var/www/certbot/.well-known/acme-challenge/*',
    '/bin/rm -f /var/www/certbot/.well-known/acme-challenge/*',
    '/bin/rm -f /var/www/certbot*',
    
    // System status checks
    '/bin/systemctl is-active --quiet nginx',
    '/bin/systemctl status nginx',
    '/bin/ls -la /etc/nginx/sites-enabled/',
    
    // SSL certificate utilities
    '/usr/bin/test -f *',
    '/usr/bin/openssl x509 -in * -noout -dates'
  ];

  /**
   * Update sudoers configuration with required NOPASSWD commands
   */
  static async updateSudoersConfiguration(username: string = 'msuser'): Promise<SudoersUpdateResult> {
    const result: SudoersUpdateResult = {
      success: false,
      message: '',
      commandsAdded: [],
      errors: []
    };

    try {
      if (!isProd) {
        Logger.info(`[SUDOERS_UPDATE] Skipping sudoers update in non-production environment`);
        result.success = true;
        result.message = 'Skipped sudoers update in non-production environment';
        return result;
      }

      Logger.info(`[SUDOERS_UPDATE] Updating sudoers configuration for user: ${username}`);

      // Create backup of existing file
      const backupPath = await this.createBackup();
      if (backupPath) {
        result.backupCreated = backupPath;
        Logger.info(`[SUDOERS_UPDATE] Created backup: ${backupPath}`);
      }

      // Generate sudoers configuration
      const sudoersContent = this.generateSudoersContent(username);

      // Write new configuration
      await this.writeSudoersFile(sudoersContent);
      
      // Set proper permissions
      await execAsync(`sudo chmod 440 ${this.SUDOERS_FILE}`);

      // Validate configuration
      const validation = await this.validateSudoersConfiguration();
      
      if (validation.isValid) {
        result.success = true;
        result.message = `Sudoers configuration updated successfully for ${username}`;
        result.commandsAdded = this.REQUIRED_COMMANDS;
        
        Logger.info(`[SUDOERS_UPDATE] Sudoers configuration updated successfully`);
        
        if (validation.warnings.length > 0) {
          Logger.warn(`[SUDOERS_UPDATE] Warnings: ${validation.warnings.join(', ')}`);
        }
        
      } else {
        result.success = false;
        result.message = 'Sudoers configuration validation failed';
        result.errors = validation.errors;
        
        // Restore backup if validation fails
        if (backupPath) {
          await this.restoreBackup(backupPath);
          Logger.warn(`[SUDOERS_UPDATE] Restored backup due to validation failure`);
        }
      }

    } catch (error: any) {
      Logger.error(`[SUDOERS_UPDATE] Error updating sudoers configuration: ${error.message}`);
      result.errors.push(`Error updating sudoers configuration: ${error.message}`);
      result.message = `Error updating sudoers configuration: ${error.message}`;
      
      // Try to restore backup on error
      if (result.backupCreated) {
        try {
          await this.restoreBackup(result.backupCreated);
          Logger.info(`[SUDOERS_UPDATE] Restored backup after error`);
        } catch (restoreError: any) {
          Logger.error(`[SUDOERS_UPDATE] Could not restore backup: ${restoreError.message}`);
        }
      }
    }

    return result;
  }

  /**
   * Check if sudoers configuration is properly set up
   */
  static async checkSudoersConfiguration(username: string = 'msuser'): Promise<SudoersValidationResult> {
    const result: SudoersValidationResult = {
      isValid: false,
      errors: [],
      warnings: []
    };

    try {
      if (!isProd) {
        result.isValid = true;
        result.warnings.push('Skipped sudoers check in non-production environment');
        return result;
      }

      // Check if sudoers file exists
      const fileExists = await fs.access(this.SUDOERS_FILE).then(() => true).catch(() => false);
      
      if (!fileExists) {
        result.errors.push(`Sudoers file does not exist: ${this.SUDOERS_FILE}`);
        return result;
      }

      // Read and validate file content
      const content = await execAsync(`sudo cat ${this.SUDOERS_FILE}`);
      const lines = content.stdout.split('\n');
      
      // Check for required commands
      const missingCommands = [];
      for (const command of this.REQUIRED_COMMANDS) {
        const found = lines.some(line => 
          line.includes('NOPASSWD:') && line.includes(command.split(' ')[0])
        );
        
        if (!found) {
          missingCommands.push(command);
        }
      }

      if (missingCommands.length > 0) {
        result.errors.push(`Missing commands in sudoers: ${missingCommands.length} commands`);
        result.warnings.push(`Missing: ${missingCommands.slice(0, 3).join(', ')}${missingCommands.length > 3 ? '...' : ''}`);
      }

      // Validate syntax
      const syntaxValidation = await this.validateSudoersConfiguration();
      result.isValid = syntaxValidation.isValid && missingCommands.length === 0;
      result.errors.push(...syntaxValidation.errors);
      result.warnings.push(...syntaxValidation.warnings);

    } catch (error: any) {
      result.errors.push(`Error checking sudoers configuration: ${error.message}`);
    }

    return result;
  }

  /**
   * Remove sudoers configuration
   */
  static async removeSudoersConfiguration(): Promise<SudoersUpdateResult> {
    const result: SudoersUpdateResult = {
      success: false,
      message: '',
      commandsAdded: [],
      errors: []
    };

    try {
      if (!isProd) {
        result.success = true;
        result.message = 'Skipped sudoers removal in non-production environment';
        return result;
      }

      Logger.info(`[SUDOERS_REMOVE] Removing sudoers configuration file`);

      // Create backup before removal
      const backupPath = await this.createBackup();
      if (backupPath) {
        result.backupCreated = backupPath;
      }

      // Remove the sudoers file
      await execAsync(`sudo rm -f ${this.SUDOERS_FILE}`);
      
      result.success = true;
      result.message = 'Sudoers configuration removed successfully';
      
      Logger.info(`[SUDOERS_REMOVE] Sudoers configuration removed`);

    } catch (error: any) {
      Logger.error(`[SUDOERS_REMOVE] Error removing sudoers configuration: ${error.message}`);
      result.errors.push(`Error removing sudoers configuration: ${error.message}`);
      result.message = `Error removing sudoers configuration: ${error.message}`;
    }

    return result;
  }

  // Private helper methods

  private static async createBackup(): Promise<string | null> {
    try {
      const fileExists = await fs.access(this.SUDOERS_FILE).then(() => true).catch(() => false);
      
      if (fileExists) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
        const backupPath = `${this.SUDOERS_FILE}.backup.${timestamp}`;
        
        await execAsync(`sudo cp ${this.SUDOERS_FILE} ${backupPath}`);
        return backupPath;
      }
    } catch (error: any) {
      Logger.warn(`[SUDOERS_BACKUP] Could not create backup: ${error.message}`);
    }
    
    return null;
  }

  private static async restoreBackup(backupPath: string): Promise<void> {
    try {
      await execAsync(`sudo cp ${backupPath} ${this.SUDOERS_FILE}`);
      Logger.info(`[SUDOERS_RESTORE] Restored backup from ${backupPath}`);
    } catch (error: any) {
      Logger.error(`[SUDOERS_RESTORE] Failed to restore backup: ${error.message}`);
      throw error;
    }
  }

  private static generateSudoersContent(username: string): string {
    const header = `# Halogen domain management - NOPASSWD commands for ${username}`;
    const sections = [
      '# Nginx configuration management',
      '# Certbot SSL certificate management', 
      '# Webroot directory management for SSL challenges',
      '# File operations for SSL challenges',
      '# System status checks',
      '# SSL certificate utilities'
    ];

    let content = header + '\n';
    let sectionIndex = 0;
    
    for (const command of this.REQUIRED_COMMANDS) {
      // Add section headers at appropriate points
      if (sectionIndex < sections.length) {
        if (command.includes('/usr/bin/certbot') && sectionIndex === 0) {
          content += sections[1] + '\n';
          sectionIndex = 2;
        } else if (command.includes('/bin/mkdir') && sectionIndex === 2) {
          content += sections[2] + '\n';
          sectionIndex = 3;
        } else if (command.includes('/bin/echo') && sectionIndex === 3) {
          content += sections[3] + '\n';
          sectionIndex = 4;
        } else if (command.includes('/bin/systemctl') && sectionIndex === 4) {
          content += sections[4] + '\n';
          sectionIndex = 5;
        } else if (command.includes('/usr/bin/test') && sectionIndex === 5) {
          content += sections[5] + '\n';
          sectionIndex = 6;
        }
      }
      
      content += `${username} ALL=(ALL) NOPASSWD: ${command}\n`;
    }

    return content;
  }

  private static async writeSudoersFile(content: string): Promise<void> {
    try {
      // Write content to a temporary file first
      const tempFile = `/tmp/sudoers_${Date.now()}`;
      await fs.writeFile(tempFile, content);
      
      // Move to final location with sudo
      await execAsync(`sudo mv ${tempFile} ${this.SUDOERS_FILE}`);
      
    } catch (error: any) {
      Logger.error(`[SUDOERS_WRITE] Failed to write sudoers file: ${error.message}`);
      throw error;
    }
  }

  private static async validateSudoersConfiguration(): Promise<SudoersValidationResult> {
    const result: SudoersValidationResult = {
      isValid: false,
      errors: [],
      warnings: []
    };

    try {
      // Use visudo to validate the configuration
      await execAsync(`sudo visudo -cf ${this.SUDOERS_FILE}`);
      result.isValid = true;
      
    } catch (error: any) {
      result.isValid = false;
      result.errors.push(`Sudoers syntax validation failed: ${error.message}`);
      
      // Try to extract specific error details
      if (error.stderr) {
        result.errors.push(`Validation details: ${error.stderr}`);
      }
    }

    return result;
  }
}
