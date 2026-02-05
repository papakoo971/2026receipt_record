import axios from 'axios';
import type { 
  User, 
  Business, 
  BudgetItem, 
  Receipt, 
  ExtractedReceiptData, 
  DashboardData,
  AuthStatus 
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authApi = {
  getStatus: () => api.get<AuthStatus>('/auth/status'),
  getMe: () => api.get<{ user: User }>('/auth/me'),
  logout: () => api.post('/auth/logout'),
  getGoogleLoginUrl: () => `${API_URL}/auth/google`,
};

// Business API
export const businessApi = {
  getAll: () => api.get<Business[]>('/businesses'),
  getById: (id: number) => api.get<Business>(`/businesses/${id}`),
  create: (data: { name: string; budgetItems: Omit<BudgetItem, 'id'>[] }) => 
    api.post<Business>('/businesses', data),
  update: (id: number, data: { name: string; budgetItems: Omit<BudgetItem, 'id'>[] }) => 
    api.put<Business>(`/businesses/${id}`, data),
  delete: (id: number) => api.delete(`/businesses/${id}`),
};

// Receipt API
export const receiptApi = {
  extract: (formData: FormData) => 
    api.post<ExtractedReceiptData>('/receipts/extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  create: (data: {
    budgetItemId: number;
    date: string;
    description: string;
    amount: number;
    notes: string | null;
    imagePath: string;
  }) => api.post<Receipt>('/receipts', data),
  getByBusiness: (businessId: number) => 
    api.get<Receipt[]>('/receipts', { params: { businessId } }),
  delete: (id: number) => api.delete(`/receipts/${id}`),
  cancelUpload: (filename: string) => 
    api.delete(`/receipts/cancel-upload/${filename}`),
};

// Dashboard API
export const dashboardApi = {
  getData: (businessId: number) => 
    api.get<DashboardData>(`/dashboard/${businessId}`),
};

// Export API
export const exportApi = {
  getExcelUrl: (businessId: number) => 
    `${API_URL}/export/excel/${businessId}`,
  getImagesUrl: (businessId: number) => 
    `${API_URL}/export/images/${businessId}`,
  exportToSheets: (businessId: number) => 
    api.post<{ message: string; spreadsheetUrl: string }>(`/export/sheets/${businessId}`),
};

// User API
export const userApi = {
  deleteAccount: () => api.delete('/users/me'),
};

// Upload URL helper
export const getUploadUrl = (imagePath: string) => 
  `${API_URL.replace('/api', '')}/uploads/${imagePath}`;

export default api;
