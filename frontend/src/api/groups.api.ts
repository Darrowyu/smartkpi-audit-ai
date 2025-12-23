import { apiClient } from './client';

export interface Group {
    id: string;
    name: string;
    settings?: Record<string, unknown>;
    isActive: boolean;
    createdAt: string;
    _count?: { companies: number };
}

export interface GroupStats {
    totalCompanies: number;
    totalUsers: number;
    totalDepartments: number;
}

export interface CompanyPerformance {
    companyId: string;
    companyName: string;
    periodName: string;
    totalEmployees: number;
    avgScore: number;
    excellent: number;
    good: number;
    average: number;
    poor: number;
}

export const groupsApi = {
    getGroup: async (groupId: string): Promise<Group> => { // 获取集团信息
        const res = await apiClient.get(`/groups/${groupId}`);
        return res.data;
    },

    getGroupStats: async (groupId: string): Promise<GroupStats> => { // 获取集团统计
        const res = await apiClient.get(`/groups/${groupId}/stats`);
        return res.data;
    },

    getGroupCompanies: async (groupId: string): Promise<{ data: Group[]; meta: { total: number } }> => { // 获取集团下所有子公司
        const res = await apiClient.get(`/groups/${groupId}/companies`);
        return res.data;
    },

    getGroupPerformance: async (periodName?: string): Promise<CompanyPerformance[]> => { // 获取集团绩效汇总（所有子公司）
        const res = await apiClient.get('/reports/group-overview', { params: { periodName } });
        return res.data;
    },

    updateGroup: async (groupId: string, data: Partial<Group>): Promise<Group> => { // 更新集团信息
        const res = await apiClient.put(`/groups/${groupId}`, data);
        return res.data;
    },
};
