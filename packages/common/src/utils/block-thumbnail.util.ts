
export class BlockThumbnailUtil {
 
  static getThumbnailPath(folderName: string, subFolder: string): string {
    return `${folderName}/${subFolder}/_thumbnail.png`;
  }

  static buildThumbnailUrl(folderName: string, subFolder: string, baseUrl = '/api/v1'): string {
    return `${baseUrl}/system/block-thumbnail?folderName=${encodeURIComponent(folderName)}&subFolder=${encodeURIComponent(subFolder)}`;
  }
}
