import { apiClient } from './client';
import { UserRole } from '../types';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isActive: boolean;
  departmentId?: string;
  companyId?: string;
  department?: { id: string; name: string };
  company?: { id: string; name: string; code?: string };
  linkedEmployeeId?: string;
  linkedEmployee?: { id: string; name: string; employeeId: string };
  phoneNumber?: string;
  language: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  email?: string | null;
  username: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  phoneNumber?: string;
  departmentId?: string;
  companyId?: string;
  linkedEmployeeId?: string;
  language?: string;
}

export interface UpdateUserData {
  email?: string | null;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
  phoneNumber?: string;
  departmentId?: string | null;
  linkedEmployeeId?: string | null;
  password?: string;
  language?: string;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpdateProfileData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
  language?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface NotificationSettings {
  emailNotify: boolean;
  pushNotify: boolean;
  smsNotify: boolean;
  kpiReminder: boolean;
  weeklyReport: boolean;
  teamUpdates: boolean;
  achievements: boolean;
  deadlineAlert: boolean;
}

export interface LoginHistoryItem {
  id: string;
  device: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  location: string | null;
  isCurrent: boolean;
  createdAt: string;
}

export interface KpiPreferences {
  defaultView: 'month' | 'week' | 'year';
  reminderFrequency: 'daily' | 'weekly' | 'monthly';
  showProgressBar: boolean;
  showTrendChart: boolean;
  autoCalculate: boolean;
  warningThreshold: number;
  selectedQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: 'blue' | 'teal' | 'purple' | 'orange' | 'custom';
  customColor?: string; // HEX 格式，如 #FF5733
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  animations: boolean;
}

export interface RegionalSettings {
  timezone: string;
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY年MM月DD日';
  timeFormat: '24h' | '12h';
}

export const getAvatarUrl = (userId: string): string => {
  const apiOrigin = import.meta.env.VITE_API_URL as string | undefined;
  const apiBasePath = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api';
  const baseUrl = apiOrigin ? `${apiOrigin.replace(/\/$/, '')}${apiBasePath}` : apiBasePath;
  return `${baseUrl}/users/avatar/${userId}?t=${Date.now()}`;
};

export const usersApi = {
  findAll: async (params?: UserQueryParams): Promise<PaginatedResponse<User>> => {
    const res = await apiClient.get('/users', { params });
    return res.data;
  },

  getUsers: async (page = 1, limit = 20, search?: string, role?: string): Promise<PaginatedResponse<User>> => { // 兼容别名
    const res = await apiClient.get('/users', { params: { page, limit, search, role } });
    return res.data;
  },

  findOne: async (id: string): Promise<User> => {
    const res = await apiClient.get(`/users/${id}`);
    return res.data;
  },

  create: async (data: CreateUserData): Promise<User> => {
    const res = await apiClient.post('/users', data);
    return res.data;
  },

  createUser: async (data: CreateUserData): Promise<User> => { // 兼容别名
    const res = await apiClient.post('/users', data);
    return res.data;
  },

  update: async (id: string, data: UpdateUserData): Promise<User> => {
    const res = await apiClient.put(`/users/${id}`, data);
    return res.data;
  },

  updateUser: async (id: string, data: UpdateUserData): Promise<User> => { // 兼容别名
    const res = await apiClient.put(`/users/${id}`, data);
    return res.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  deleteUser: async (id: string): Promise<void> => { // 兼容别名
    await apiClient.delete(`/users/${id}`);
  },

  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const res = await apiClient.patch('/users/me/profile', data);
    return res.data;
  },

  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
    const res = await apiClient.post('/users/me/password', data);
    return res.data;
  },

  uploadAvatar: async (file: File): Promise<{ id: string; avatar: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await apiClient.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getNotificationSettings: async (): Promise<NotificationSettings> => {
    const res = await apiClient.get('/users/me/notification-settings');
    return res.data;
  },

  updateNotificationSettings: async (data: Partial<NotificationSettings>): Promise<NotificationSettings> => {
    const res = await apiClient.patch('/users/me/notification-settings', data);
    return res.data;
  },

  getLoginHistory: async (): Promise<LoginHistoryItem[]> => {
    const res = await apiClient.get('/users/me/login-history');
    return res.data;
  },

  getKpiPreferences: async (): Promise<KpiPreferences> => {
    const res = await apiClient.get('/users/me/kpi-preferences');
    return res.data;
  },

  updateKpiPreferences: async (data: Partial<KpiPreferences>): Promise<KpiPreferences> => {
    const res = await apiClient.patch('/users/me/kpi-preferences', data);
    return res.data;
  },

  getAppearanceSettings: async (): Promise<AppearanceSettings> => {
    const res = await apiClient.get('/users/me/appearance-settings');
    return res.data;
  },

  updateAppearanceSettings: async (data: Partial<AppearanceSettings>): Promise<AppearanceSettings> => {
    const res = await apiClient.patch('/users/me/appearance-settings', data);
    return res.data;
  },

  getRegionalSettings: async (): Promise<RegionalSettings> => {
    const res = await apiClient.get('/users/me/regional-settings');
    return res.data;
  },

  updateRegionalSettings: async (data: Partial<RegionalSettings>): Promise<RegionalSettings> => {
    const res = await apiClient.patch('/users/me/regional-settings', data);
    return res.data;
  },
};
