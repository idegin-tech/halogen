import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';

// Create an Axios instance with default configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/session authentication
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const response = error.response as AxiosResponse;
    
    // Handle specific HTTP error codes
    if (response?.status === 401) {
      // Session expired or not authenticated
      toast.error('Your session has expired. Please log in again.');
    } else if (response?.status === 403) {
      toast.error('You don\'t have permission to perform this action.');
    } else if (response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

// Helper function to get data from responses
export const extractResponseData = <T>(response: AxiosResponse): T => response.data.payload;

export default apiClient;