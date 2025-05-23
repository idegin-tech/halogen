import puppeteer from 'puppeteer';
import path from 'path';
import Logger from '../config/logger.config';
import { FileSystemUtil } from './fs.util';
import { FileReplacementUtil } from './file-replacement.util';

/**
 * Takes a screenshot of a website and uploads it to Cloudinary
 * @param url The URL to take a screenshot of
 * @param projectId The ID of the project (used for Cloudinary folder)
 * @returns The URL of the uploaded screenshot
 */
export async function takeScreenshotAndUpload(url: string, projectId: string): Promise<string> {
  let browser;
  const tempDir = FileSystemUtil.getTempSubDir('screenshots');
  const screenshotPath = path.join(tempDir, `project_thumbnail.png`);

  try {
    Logger.info(`Taking screenshot of ${url}`);

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ]
    });

    const page = await browser.newPage();

    page.setDefaultNavigationTimeout(60000); // 60 seconds

    await page.setViewport({
      width: 1200,
      height: 800
    });

    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });

      await new Promise(resolve => setTimeout(resolve, 9000));

    } catch (navigationError) {
      Logger.warn(`Initial navigation to ${url} failed, trying with fallback: ${navigationError instanceof Error ? navigationError.message : 'Unknown error'}`);

      try {
        await page.goto(url, {
          waitUntil: 'load',
          timeout: 30000
        });

        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (fallbackError) {
        Logger.warn(`Fallback navigation also failed, will attempt to capture whatever loaded: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    }

    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
      type: 'png'
    });

    Logger.info(`Screenshot saved to ${screenshotPath}`);

    const uploadResult = await FileReplacementUtil.replaceFile(
      screenshotPath,
      'thumbnails',
      projectId,
      'project_thumbnail',
      {
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 80, fetch_format: 'auto' }
        ]
      }
    );

    Logger.info(`Screenshot uploaded to Cloudinary: ${uploadResult.url || 'No URL returned'}`);

    FileSystemUtil.deleteFile(screenshotPath);

    return uploadResult.url;
  } catch (error) {
    Logger.error(`Error taking screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);

    FileSystemUtil.deleteFile(screenshotPath);

    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
