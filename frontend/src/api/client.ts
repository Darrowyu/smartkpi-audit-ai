import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

const TOKEN_KEY = 'smartkpi_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

// Request interceptor: Add JWT token
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Error message mapping
const getErrorMessage = (error: AxiosError<{ message?: string }>) => {
  const status = error.response?.status;
  const serverMessage = error.response?.data?.message;

  if (serverMessage) return serverMessage;

  switch (status) {
    case 400: return 'Bad Request';
    case 401: return 'Session expired, please login again';
    case 403: return 'You do not have permission to perform this action';
    case 404: return 'Resource not found';
    case 500: return 'Server error, please try again later';
    default: return error.message || 'Network error';
  }
};

// Response interceptor: Unified error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;

    // Handle authentication errors
    if (status === 401) {
      removeToken();
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Enrich error with user-friendly message
    const enrichedError = {
      ...error,
      userMessage: getErrorMessage(error),
      status,
    };

    return Promise.reject(enrichedError);
  }
);

// API helper types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
