import fs from 'fs';
import path from 'path';
import os from 'os';
import { appConfig } from '@halogen/common';
import Logger from '../config/logger.config';

/**
 * Utility class for file system operations with improved temporary directory handling
 */
export class FileSystemUtil {
  /**
   * Returns the base temporary directory for the application
   * Uses OS temp directory + application name from config
   */
  static getTempBaseDir(): string {
    const tempBaseDir = path.join(os.tmpdir(), appConfig.cloudinaryPath);

    if (!fs.existsSync(tempBaseDir)) {
      fs.mkdirSync(tempBaseDir, { recursive: true });
    }

    return tempBaseDir;
  }

  /**
   * Gets a subdirectory in the application temp directory
   * @param subDir - Name of subdirectory
   * @returns Path to the subdirectory
   */
  static getTempSubDir(subDir: string): string {
    const tempSubDir = path.join(FileSystemUtil.getTempBaseDir(), subDir);

    if (!fs.existsSync(tempSubDir)) {
      fs.mkdirSync(tempSubDir, { recursive: true });
    }

    return tempSubDir;
  }

  /**
   * Delete a file if it exists
   * @param filePath - Path to file to delete
   */
  static deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      Logger.error(`Error deleting file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up orphaned temporary files older than the specified age
   * @param maxAgeMs - Maximum age of files in milliseconds (default: 24 hours)
   */
  static cleanupOrphanedTempFiles(maxAgeMs = 24 * 60 * 60 * 1000): void {
    try {
      const tempBaseDir = FileSystemUtil.getTempBaseDir();
      const now = Date.now();

      // Process each subdirectory
      const subdirs = fs.readdirSync(tempBaseDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      let filesRemoved = 0;

      for (const subdir of subdirs) {
        const subdirPath = path.join(tempBaseDir, subdir);

        try {
          const files = fs.readdirSync(subdirPath);

          for (const file of files) {
            const filePath = path.join(subdirPath, file);

            try {
              const stats = fs.statSync(filePath);
              const fileAge = now - stats.mtimeMs;

              if (fileAge > maxAgeMs) {
                fs.unlinkSync(filePath);
                filesRemoved++;
              }
            } catch (fileError) {
              Logger.warn(`Error processing temp file ${filePath}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
            }
          }
        } catch (subdirError) {
          Logger.warn(`Error reading temp directory ${subdirPath}: ${subdirError instanceof Error ? subdirError.message : 'Unknown error'}`);
        }
      }

      Logger.info(`Temp file cleanup complete: Removed ${filesRemoved} orphaned files`);
    } catch (error) {
      Logger.error(`Error cleaning up orphaned temp files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Schedule periodic cleanup of temporary files
   * @param intervalMs - Cleanup interval in milliseconds (default: 12 hours)
   */
  static schedulePeriodicCleanup(intervalMs = 12 * 60 * 60 * 1000): NodeJS.Timer {
    Logger.info(`Scheduling periodic temp file cleanup every ${intervalMs / (60 * 60 * 1000)} hours`);

    // Run initial cleanup
    FileSystemUtil.cleanupOrphanedTempFiles();

    return setInterval(() => {
      FileSystemUtil.cleanupOrphanedTempFiles();
    }, intervalMs);
  }
}

export default FileSystemUtil;
