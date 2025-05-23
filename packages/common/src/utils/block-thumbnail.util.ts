/**
 * Utility for working with block thumbnails
 */
export class BlockThumbnailUtil {
  /**
   * Gets the thumbnail path for a block
   * @param folderName The folder name (category) of the block
   * @param subFolder The subfolder (name) of the block
   * @returns Path to the thumbnail
   */
  static getThumbnailPath(folderName: string, subFolder: string): string {
    return `${folderName}/${subFolder}/_thumbnail.png`;
  }

  /**
   * Builds the API URL for a block thumbnail
   * @param folderName The folder name (category) of the block
   * @param subFolder The subfolder (name) of the block
   * @param baseUrl Optional base URL, defaults to /api/v1
   * @returns The full URL to fetch the thumbnail
   */
  static buildThumbnailUrl(folderName: string, subFolder: string, baseUrl = '/api/v1'): string {
    return `${baseUrl}/system/block-thumbnail?folderName=${encodeURIComponent(folderName)}&subFolder=${encodeURIComponent(subFolder)}`;
  }
}
