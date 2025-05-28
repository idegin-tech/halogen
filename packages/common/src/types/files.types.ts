export interface FileData {
  _id: string;
  project: string;
  path: string;
  name: string;
  extension: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
  thumbnailUrl?: string;
  user: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileListResponse {
  docs: FileData[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export interface FileUploadResponse {
  files: FileData[];
  errors: {
    name: string;
    error: string;
  }[];
  totalUploaded: number;
  totalErrors: number;
}

export interface FileDeleteResponse {
  deletedCount: number;
  fileIds: string[];
}

export interface FileQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  type?: string; 
  mimeTypes?: string[]; 
}

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
export const SUPPORTED_AUDIO_TYPES = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm'];

export const SUPPORTED_FILE_TYPES = [
  ...SUPPORTED_IMAGE_TYPES,
  ...SUPPORTED_VIDEO_TYPES,
  ...SUPPORTED_AUDIO_TYPES
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_FILES_PER_UPLOAD = 20;
