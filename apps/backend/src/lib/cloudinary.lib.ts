import { v2 as cloudinary } from 'cloudinary';
import { appConfig } from '@halogen/common';
import Logger from '../config/logger.config';
import { UploadApiOptions, UploadApiResponse } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

/**
 * Upload file to Cloudinary
 * @param filePath - Local path to file
 * @param folder - Folder path within Cloudinary
 * @param options - Additional Cloudinary upload options
 * @returns Cloudinary upload response
 */
export const uploadToCloudinary = async (
    filePath: string,
    folder: string,
    options: Record<string, any> = {}
): Promise<CloudinaryUploadResponse> => {
    try {
        const fullFolderPath = `${appConfig.cloudinaryPath}/${folder}`;
        
        const isImage = options.resource_type === 'image' || filePath.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
        
        const uploadOptions: UploadApiOptions = {
            folder: fullFolderPath,
            resource_type: (options.resource_type as "image" | "auto" | "video" | "raw") || 'auto'
        };

        Object.keys(options).forEach(key => {
            if (key !== 'resource_type') {
                (uploadOptions as any)[key] = options[key];
            }
        });
        
        // Apply default compression settings for images if not already specified
        if (isImage) {
            if (!options.eager) {
                uploadOptions.eager = [
                    { width: 200, height: 200, crop: 'fill', format: 'jpg', quality: 80 }
                ];
            }
            
            // Add default quality settings if not specified
            if (!options.quality) {
                uploadOptions.quality = 'auto';
                uploadOptions.fetch_format = 'auto';
            }
        }

        const uploadResult = await cloudinary.uploader.upload(filePath, uploadOptions) as UploadApiResponse;      
        let thumbnailUrl;
        if (uploadResult.eager && uploadResult.eager[0]) {
            thumbnailUrl = uploadResult.eager[0].secure_url;
        }

        return {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            format: uploadResult.format,
            width: uploadResult.width,
            height: uploadResult.height,
            size: uploadResult.bytes,
            thumbnail_url: thumbnailUrl
        };
    } catch (error) {
        console.error(error)
        Logger.error(`Cloudinary upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
    }
};

/**
 * Replace a file in Cloudinary with a new file
 * This will delete the old file and upload a new one with the same public ID
 * @param filePath - Local path to new file
 * @param publicId - Public ID of file to replace
 * @param options - Additional Cloudinary upload options
 * @returns Cloudinary upload response
 */
export const replaceInCloudinary = async (
    filePath: string,
    publicId: string,
    options: Record<string, any> = {}
): Promise<CloudinaryUploadResponse> => {
    try {
        // Delete the existing file first
        await deleteFromCloudinary(publicId);

        // Extract folder path from publicId
        const parts = publicId.split('/');
        const filename = parts.pop(); // Remove the filename
        const folder = parts.join('/').replace(`${appConfig.cloudinaryPath}/`, ''); // Remove cloudinary path prefix

        // Upload the new file with the same public_id
        const uploadOptions = {
            ...options,
            public_id: filename
        };

        return await uploadToCloudinary(filePath, folder, uploadOptions);
    } catch (error) {
        Logger.error(`Cloudinary replace error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
    }
};

/**
 * Delete a file from Cloudinary
 * @param publicId - The file's public ID in Cloudinary
 * @returns Success status
 */
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === 'ok';
    } catch (error) {
        console.log(error)
        Logger.error(`Cloudinary delete error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
    }
};

/**
 * Extract public ID from a Cloudinary URL
 * @param url - Cloudinary URL
 * @returns Public ID or null if not a valid Cloudinary URL
 */
export const getPublicIdFromUrl = (url: string): string | null => {
    if (!url || typeof url !== 'string') return null;

    try {
        // Cloudinary URLs follow this pattern: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
        const match = url.match(/\/v\d+\/(.+?)(?:\.\w+)?$/);

        if (match && match[1]) {
            return match[1];
        }
        return null;
    } catch (error) {
        Logger.error(`Error extracting public ID from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return null;
    }
};

export interface CloudinaryUploadResponse {
    url: string;
    secure_url?: string;
    publicId: string;
    format: string;
    width: number;
    height: number;
    size: number;
    thumbnail_url?: string;
}

export default {
    uploadToCloudinary,
    replaceInCloudinary,
    deleteFromCloudinary,
    getPublicIdFromUrl
};
