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
};
