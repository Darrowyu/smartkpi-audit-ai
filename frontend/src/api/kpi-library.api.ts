import { apiClient } from './client';
import { KPIDefinition, QueryKPIDefinitionDto } from '../types';

export const kpiLibraryApi = {
    // 获取列表
    findAll: async (query: QueryKPIDefinitionDto) => {
        const response = await apiClient.get('/kpi-library', { params: query });
        return response.data;
    },

    // 创建
    create: async (data: Partial<KPIDefinition>) => {
        const response = await apiClient.post('/kpi-library', data);
        return response.data;
    },

    // 更新
    update: async (id: string, data: Partial<KPIDefinition>) => {
        const response = await apiClient.put(`/kpi-library/${id}`, data);
        return response.data;
    },

    // 删除
    remove: async (id: string) => {
        const response = await apiClient.delete(`/kpi-library/${id}`);
        return response.data;
    },
};
