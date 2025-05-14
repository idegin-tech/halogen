import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Logger from '../config/logger.config';

// Temporary directory for processed images
const tempDir = path.join(__dirname, '../../../uploads/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

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
    if (fs.existsSync(pngPath)) {
      fs.unlinkSync(pngPath);
    }
    
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
 * Cleanup temporary processed images
 * @param filePath - Path to file to delete
 */
export const cleanupTempFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath) && filePath.includes(tempDir)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    Logger.error(`Error cleaning up temp file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export default {
  processFavicon,
  convertToIco,
  processOpenGraphImage,
  cleanupTempFile
};
