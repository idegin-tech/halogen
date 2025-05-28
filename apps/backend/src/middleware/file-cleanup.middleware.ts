import { Request, Response, NextFunction } from 'express';
import { FileSystemUtil } from '../lib/fs.util';
import Logger from '../config/logger.config';

export class FileCleanupMiddleware {
  static cleanupAfterRequest(req: Request, res: Response, next: NextFunction): void {
    const originalEnd = res.end;

    res.end = function (...args: any[]): any {
      res.end = originalEnd;

      if (req.file && req.file.path) {
        FileSystemUtil.deleteFile(req.file.path);
        Logger.debug(`Cleaned up temporary file: ${req.file.path}`);
      }

      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file: Express.Multer.File) => {
          if (file.path) {
            FileSystemUtil.deleteFile(file.path);
            Logger.debug(`Cleaned up temporary file: ${file.path}`);
          }
        });
      }

      return res.end(...args);
    };

    next();
  }
}

export default FileCleanupMiddleware;
