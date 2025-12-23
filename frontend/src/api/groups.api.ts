import { apiClient } from './client';

export interface Group {
  id: string;
  name: string;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  _count?: { companies: number };
}

export interface GroupStats {
  totalCompanies: number;
  totalUsers: number;
  totalDepartments: number;
}

export const groupsApi = {
  // 获取集团信息
  async getGroup(id: string): Promise<Group> {
    const res = await apiClient.get(`/groups/${id}`);
    return res.data;
  },

  // 获取集团统计
  async getGroupStats(groupId: string): Promise<GroupStats> {
    const res = await apiClient.get(`/groups/${groupId}/stats`);
    return res.data;
  },
};

