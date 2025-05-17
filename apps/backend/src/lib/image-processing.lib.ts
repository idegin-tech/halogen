import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Logger from '../config/logger.config';
import { FileSystemUtil } from './fs.util';

// Use OS temp directory instead of project-local storage
const tempDir = FileSystemUtil.getTempSubDir('processed');

/**
 * Optimize uploaded image while preserving quality
 * @param inputPath - Path to input image
 * @param originalName - Original filename
 * @returns Path to optimized image
 */
export const optimizeImage = async (inputPath: string, originalName: string): Promise<string> => {
  try {
    const extension = path.extname(originalName).toLowerCase();
    const outputPath = path.join(tempDir, `optimized-${uuidv4()}${extension}`);
    
    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    
    // Only process if it's an image we can optimize
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
      let sharpImage = sharp(inputPath);
      
      // Process based on image format
      switch (extension) {
        case '.jpg':
        case '.jpeg':
          await sharpImage
            .jpeg({ 
              quality: 80, 
              mozjpeg: true, 
              // Preserve original size
              force: false
            })
            .toFile(outputPath);
          break;
        case '.png':
          await sharpImage
            .png({ 
              quality: 80, 
              compressionLevel: 9, 
              palette: true,
              // Only use palette for smaller images
              adaptiveFiltering: true,
              force: false
            })
            .toFile(outputPath);
          break;
        case '.webp':
          await sharpImage
            .webp({ 
              quality: 80,
              // Reduce file size while maintaining quality
              effort: 6, 
              force: false
            })
            .toFile(outputPath);
          break;
        default:
          // For unsupported extensions, copy the file as is
          await fs.promises.copyFile(inputPath, outputPath);
      }
      
      // Check if optimization actually reduced file size
      const originalStats = await fs.promises.stat(inputPath);
      const optimizedStats = await fs.promises.stat(outputPath);
      
      // If optimization didn't reduce size, use the original
      if (optimizedStats.size >= originalStats.size) {
        FileSystemUtil.deleteFile(outputPath);
        Logger.info(`Optimization didn't reduce size for ${originalName}, using original`);
        return inputPath;
      }
      
      const savingsPercent = ((originalStats.size - optimizedStats.size) / originalStats.size * 100).toFixed(2);
      Logger.info(`Optimized image ${originalName}: Reduced by ${savingsPercent}% (${originalStats.size} → ${optimizedStats.size} bytes)`);
      return outputPath;
    } else {
      // For unsupported types, copy the file as is
      await fs.promises.copyFile(inputPath, outputPath);
      return outputPath;
    }
  } catch (error) {
    Logger.error(`Error optimizing image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // Return original file path if optimization fails
    return inputPath;
  }
};

/**
 * Resize and process an image to favicon format (32x32)
 * @param inputPath - Path to input image
 * @returns Path to processed favicon
 */
export const processFavicon = async (inputPath: string): Promise<string> => {
  try {
    const outputPath = path.join(tempDir, `favicon-${uuidv4()}.png`);
    
    await sharp(inputPath)
      .resize({
        width: 32,
        height: 32,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFormat('png')
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    Logger.error(`Error processing favicon: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

/**
 * Convert an image to ICO format for favicon
 * @param inputPath - Path to input image
 * @returns Path to ICO file
 */
export const convertToIco = async (inputPath: string): Promise<string> => {
  try {
    const pngPath = await processFavicon(inputPath);
    
    const outputPath = path.join(tempDir, `favicon-${uuidv4()}.ico`);
    
    const buffer = await sharp(pngPath)
      .resize(32, 32)
      .toFormat('png')
      .toBuffer();
    
    await fs.promises.writeFile(outputPath, buffer);
    
    // Clean up temporary PNG
    FileSystemUtil.deleteFile(pngPath);

    return outputPath;
  } catch (error) {
    Logger.error(`Error converting to ICO: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

/**
 * Process Open Graph image to recommended dimensions
 * @param inputPath - Path to input image
 * @returns Path to processed image
 */
export const processOpenGraphImage = async (inputPath: string): Promise<string> => {
  try {
    const outputPath = path.join(tempDir, `og-${uuidv4()}.jpeg`);
    
    await sharp(inputPath)
      .resize({
        width: 1200,
        height: 630,
        fit: 'inside',
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    Logger.error(`Error processing OG image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

/**
 * Generate thumbnail for project
 * @param inputPath - Path to input image
 * @returns Path to processed thumbnail
 */
export const generateProjectThumbnail = async (inputPath: string): Promise<string> => {
  try {
    const outputPath = path.join(tempDir, `thumbnail-${uuidv4()}.jpeg`);

    await sharp(inputPath)
      .resize({
        width: 600,
        height: 400,
        fit: 'inside',
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    Logger.error(`Error generating project thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

/**
 * Cleanup temporary processed images
 * @param filePath - Path to file to delete
 */
export const cleanupTempFile = (filePath: string): void => {
  FileSystemUtil.deleteFile(filePath);
};

export default {
  optimizeImage,
  processFavicon,
  convertToIco,
  processOpenGraphImage,
  generateProjectThumbnail,
  cleanupTempFile
};
