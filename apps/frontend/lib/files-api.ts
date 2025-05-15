import apiClient from './api-client';
import { extractResponseData } from './api-client';
import { 
  FileData, 
  FileListResponse, 
  FileUploadResponse, 
  FileDeleteResponse, 
  FileQueryOptions 
} from '@halogen/common';

// Get project files
export const getProjectFiles = async (projectId: string, options: FileQueryOptions = {}): Promise<FileListResponse> => {
  const { page, limit, search, sort } = options;
  const queryParams = new URLSearchParams();
  
  if (page) queryParams.append('page', page.toString());
  if (limit) queryParams.append('limit', limit.toString());
  if (search) queryParams.append('search', search);
  if (sort) queryParams.append('sort', sort);

  const response = await apiClient.get(`/uploads/project/${projectId}/files?${queryParams.toString()}`);
  return extractResponseData<FileListResponse>(response);
};

export const uploadProjectFiles = async (projectId: string, files: File[]): Promise<FileUploadResponse> => {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await apiClient.post(`/uploads/project/${projectId}/files`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return extractResponseData<FileUploadResponse>(response);
};

// Delete files from project
export const deleteProjectFiles = async (projectId: string, fileIds: string[]): Promise<FileDeleteResponse> => {
  const response = await apiClient.delete(`/uploads/project/${projectId}/files`, {
    data: { fileIds },
  });
  
  return extractResponseData<FileDeleteResponse>(response);
};
