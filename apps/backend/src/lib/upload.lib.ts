import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Logger from '../config/logger.config';
import { FileSystemUtil } from './fs.util';

const uploadDir = FileSystemUtil.getTempSubDir('uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

const fileSize = 20 * 1024 * 1024; // 20 MB

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimetypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp', 
    'image/svg+xml',
    'image/x-icon', 
    'image/vnd.microsoft.icon'
  ];

  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Please upload an image file.'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize,
  },
  fileFilter,
});

/**
 * Delete a file from the temporary uploads directory
 * @param filePath - Path to the file to delete
 */
export const deleteLocalFile = (filePath: string): void => {
  FileSystemUtil.deleteFile(filePath);
};

export default {
  upload,
  deleteLocalFile,
};
