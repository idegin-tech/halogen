"use client";

import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';

// Define API response structure to match backend
interface ApiResponse<T> {
  status: string;
  message: string;
  payload: T;
}

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Error handler
const handleError = (error: any) => {
  const message =
    error instanceof AxiosError
      ? error.response?.data?.message || error.message
      : error instanceof Error
        ? error.message
        : 'An unexpected error occurred';

  toast.error(message);
  return message;
};

// Types
export type ApiState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
};

export function useQuery<T>(
  endpoint: string,
  config?: AxiosRequestConfig,
  dependencies: any[] = [],
  options = { enabled: true }
) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });
  const execute = useCallback(async () => {
    if (!endpoint || !options.enabled) return null;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.get<ApiResponse<T>>(endpoint, config);
      setState({
        data: response.data.payload,
        isLoading: false,
        error: null,
      });
      return response.data.payload;
    } catch (error) {
      // Don't show toast for 404 responses as they're often expected
      if (error instanceof AxiosError && error.response?.status === 404) {
        setState({
          data: null,
          isLoading: false,
          error: 'Not found',
        });
      } else {
        const errorMessage = handleError(error);
        setState({
          data: null,
          isLoading: false,
          error: errorMessage,
        });
      }
      return null;
    }
  }, [endpoint, config, options.enabled]);
  useEffect(() => {
    if (endpoint) {
      execute();
    }
  }, [...dependencies]);

  return {
    ...state,
    execute,
    refetch: execute,
  };
}

export function useMutation<T, D = any>(endpoint: string, config?: AxiosRequestConfig) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(async (path?: any, data?: D) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const requestEndpoint = typeof path === 'string' ? `${endpoint}/${path}` : endpoint;
      const requestData = typeof path === 'string' ? data : path;
      const method = config?.method?.toLowerCase() || 'post';
      
      let response: AxiosResponse<ApiResponse<T>>;
      
      if (method === 'put') {
        response = await api.put<ApiResponse<T>>(requestEndpoint, requestData, config);
      } else if (method === 'patch') {
        response = await api.patch<ApiResponse<T>>(requestEndpoint, requestData, config); 
      } else {
        response = await api.post<ApiResponse<T>>(requestEndpoint, requestData, config);
      }
      
      setState({
        data: response.data.payload,
        isLoading: false,
        error: null
      });
      return response.data.payload;
    } catch (error) {
      const errorMessage = handleError(error);
      setState({
        data: null,
        isLoading: false,
        error: errorMessage
      });
      return null;
    }
  }, [endpoint, config]);

  const update = useCallback(async (id: string, data: Partial<D>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.put<ApiResponse<T>>(
        `${endpoint}/${id}`,
        data,
        config
      );
      setState({
        data: response.data.payload,
        isLoading: false,
        error: null
      });
      return response.data.payload;
    } catch (error) {
      const errorMessage = handleError(error);
      setState({
        data: null,
        isLoading: false,
        error: errorMessage
      });
      return null;
    }
  }, [endpoint, config]);

  const remove = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.delete<ApiResponse<T>>(
        `${endpoint}/${id}`,
        config
      );
      setState({
        data: response.data.payload,
        isLoading: false,
        error: null
      });
      return response.data.payload;
    } catch (error) {
      const errorMessage = handleError(error);
      setState({
        data: null,
        isLoading: false,
        error: errorMessage
      });
      return null;
    }
  }, [endpoint, config]);

  return {
    ...state,
    mutate,
    update,
    remove
  };
}