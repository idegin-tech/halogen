'use server';

import { PaginatedResponse } from '@halogen/common/types';
import { cookies } from 'next/headers';

interface ApiResponse<T> {
  status: string;
  message: string;
  payload: T;
}

export async function fetchFromApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('halogen.sid');
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const url = `${apiUrl}${endpoint}`;
  
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');
  
  if (sessionCookie) {
    headers.set('Cookie', `halogen.sid=${sessionCookie.value}`);
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'API request failed');
  }
  
  const data: ApiResponse<T> = await response.json();
  return data.payload;
}

export interface ProjectData {
  _id: string;
  name: string;
  description?: string;
  project_id: string;
  subdomain: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'subdomain';
  sortOrder?: 'asc' | 'desc';
}

export async function getProjects(params: ProjectQueryParams = {}): Promise<PaginatedResponse<ProjectData>> {
  const queryParams = new URLSearchParams();
  
  if (params.search) queryParams.set('search', params.search);
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchFromApi<PaginatedResponse<ProjectData>>(`/projects${queryString}`);
}