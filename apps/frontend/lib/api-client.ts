import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const response = error.response as AxiosResponse;
    
    if (response?.status === 401) {
      toast.error('Your session has expired. Please log in again.');
    } else if (response?.status === 403) {
      toast.error('You don\'t have permission to perform this action.');
    } else if (response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

export const extractResponseData = <T>(response: AxiosResponse): T => response.data.payload;

export default apiClient;