import { v2 as cloudinary } from 'cloudinary';
import { appConfig } from '@halogen/common';
import Logger from '../config/logger.config';

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

        const uploadResult = await cloudinary.uploader.upload(filePath, {
            folder: fullFolderPath,
            resource_type: 'auto',
            ...options
        });

        return {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            format: uploadResult.format,
            width: uploadResult.width,
            height: uploadResult.height,
            size: uploadResult.bytes
        };
    } catch (error) {
        console.error(error)
        Logger.error(`Cloudinary upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

export interface CloudinaryUploadResponse {
    url: string;
    publicId: string;
    format: string;
    width: number;
    height: number;
    size: number;
}

export default {
    uploadToCloudinary,
    deleteFromCloudinary
};
