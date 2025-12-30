import { apiClient } from './client';

export interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  _count?: { employees: number; users: number };
}

export interface CreateDepartmentDto {
  name: string;
  code?: string;
  description?: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

// 获取部门列表
export const getDepartments = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  companyId?: string; // GROUP_ADMIN 可按公司筛选
}): Promise<{ data: Department[]; meta: { total: number; page: number; limit: number; totalPages: number } }> => {
  const { data } = await apiClient.get('/departments', { params });
  return data;
};

// 获取单个部门
export const getDepartment = async (id: string): Promise<Department> => {
  const { data } = await apiClient.get(`/departments/${id}`);
  return data;
};

// 创建部门
export const createDepartment = async (dto: CreateDepartmentDto): Promise<Department> => {
  const { data } = await apiClient.post('/departments', dto);
  return data;
};

// 更新部门
export const updateDepartment = async (id: string, dto: UpdateDepartmentDto): Promise<Department> => {
  const { data } = await apiClient.put(`/departments/${id}`, dto);
  return data;
};

// 删除部门（软删除）
export const deleteDepartment = async (id: string): Promise<{ message: string }> => {
  const { data } = await apiClient.delete(`/departments/${id}`);
  return data;
};

