'use server';

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
