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
  department?: { id: string; name: string };
  linkedEmployeeId?: string;
  linkedEmployee?: { id: string; name: string; employeeId: string };
  phoneNumber?: string;
  language: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  email: string;
  username: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  phoneNumber?: string;
  departmentId?: string;
  linkedEmployeeId?: string;
  language?: string;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
  phoneNumber?: string;
  departmentId?: string;
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
  language?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
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
};
