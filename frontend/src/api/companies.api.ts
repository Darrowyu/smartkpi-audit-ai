import { apiClient } from './client';

export interface Company {
  id: string;
  name: string;
  code?: string; // 公司代码
  domain?: string; // 域名标识
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  _count?: {
    users: number;
    departments: number;
    employees: number;
    uploadedFiles: number;
    kpiAnalyses: number;
  };
}

export interface CompanyStats {
  users: number;
  departments: number;
  employees: number;
  files: number;
  analyses: number;
}

export interface CreateCompanyData {
  name: string;
  code?: string; // 公司代码
  domain?: string; // 域名标识
  settings?: Record<string, unknown>;
}

export interface UpdateCompanyData {
  name?: string;
  code?: string; // 公司代码
  domain?: string; // 域名标识
  settings?: Record<string, unknown>;
  isActive?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const companiesApi = {
  // 获取当前公司信息
  async getCompany(): Promise<Company> {
    const res = await apiClient.get('/company');
    return res.data;
  },

  // 获取公司统计数据
  async getStats(): Promise<CompanyStats> {
    const res = await apiClient.get('/company/stats');
    return res.data;
  },

  // 更新公司信息（仅管理员）
  async updateCompany(data: UpdateCompanyData): Promise<Company> {
    const res = await apiClient.put('/company', data);
    return res.data;
  },

  // ========== GROUP_ADMIN 专用 API ==========

  // 创建子公司
  async createCompany(data: CreateCompanyData): Promise<Company> {
    const res = await apiClient.post('/companies', data);
    return res.data;
  },

  // 获取集团下所有子公司
  async getCompanies(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Company>> {
    const res = await apiClient.get('/companies', { params });
    return res.data;
  },

  // 获取指定子公司详情
  async getCompanyById(id: string): Promise<Company> {
    const res = await apiClient.get(`/companies/${id}`);
    return res.data;
  },

  // 更新指定子公司
  async updateCompanyById(id: string, data: UpdateCompanyData): Promise<Company> {
    const res = await apiClient.put(`/companies/${id}`, data);
    return res.data;
  },

  // 删除子公司
  async deleteCompany(id: string): Promise<{ message: string }> {
    const res = await apiClient.delete(`/companies/${id}`);
    return res.data;
  },
};

