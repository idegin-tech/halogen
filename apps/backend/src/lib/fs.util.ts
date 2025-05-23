import fs from 'fs';
import path from 'path';
import os from 'os';
import { appConfig } from '@halogen/common';
import Logger from '../config/logger.config';

export class FileSystemUtil {
  static getTempBaseDir(): string {
    const tempBaseDir = path.join(os.tmpdir(), appConfig.cloudinaryPath);

    if (!fs.existsSync(tempBaseDir)) {
      fs.mkdirSync(tempBaseDir, { recursive: true });
    }

    return tempBaseDir;
  }

  static getTempSubDir(subDir: string): string {
    const tempSubDir = path.join(FileSystemUtil.getTempBaseDir(), subDir);

    if (!fs.existsSync(tempSubDir)) {
      fs.mkdirSync(tempSubDir, { recursive: true });
    }

    return tempSubDir;
  }

  static deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      Logger.error(`Error deleting file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

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

}

export default FileSystemUtil;
