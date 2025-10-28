import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://banky-app-samaj.vercel.app';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  register: (userData: { name: string; email: string; password: string }) =>
    api.post('/api/auth/register', userData),
    
  login: (credentials: { email: string; password: string }) =>
    api.post('/api/auth/login', credentials),
    
  adminLogin: (credentials: { email: string; password: string }) =>
    api.post('/api/auth/admin-login', credentials),
    
  verifyEmail: (token: string) =>
    api.post('/api/auth/verify-email', { token }),
};

// User API functions
export const userAPI = {
  getProfile: () => api.get('/api/user/profile'),
  
  getTransactions: () => api.get('/api/user/transactions'),
  
  transfer: (transferData: {
    receiverAccount: string;
    amount: number;
    type: 'internal' | 'external';
    narration?: string;
  }) => api.post('/api/user/transfer', transferData),
  
  createTransfer: (transferData: {
    receiverAccount: string;
    amount: number;
    narration?: string;
    type?: 'internal' | 'external';
  }) => api.post('/api/user/transfer', transferData),
};

// Admin API functions
export const adminAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/api/auth/admin-login', credentials),
    
  getUsers: () => api.get('/api/admin/users'),
  
  approveUser: (userId: string) => api.post('/api/admin/approve-user', { userId }),
  
  getTransactions: () => api.get('/api/admin/transactions'),
  
  testEmail: (email: string) => api.post('/api/admin/test-email', { email }),
};

// Generic error handler
export const handleAPIError = (error: any) => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  } else if (error.response?.data?.details) {
    // Handle Joi validation errors with details
    return `Validation error: ${error.response.data.details.join(', ')}`;
  } else if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  } else {
    return 'An unexpected error occurred';
  }
};

// Helper function to format currency
export const formatCurrency = (amount: number | null | undefined): string => {
  const numericAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numericAmount);
};

// Helper function to format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Helper function to get transaction status badge class
export const getTransactionStatusClass = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'badge-success';
    case 'pending':
      return 'badge-warning';
    case 'failed':
      return 'badge-danger';
    default:
      return 'badge-info';
  }
};

export default api;