import { apiClient } from './client';
import { KPIDefinition, QueryKPIDefinitionDto } from '../types';

export interface KPILibraryStats {
    total: number;
    active: number;
    inactive: number;
    byType: Record<string, number>;
    byFrequency: Record<string, number>;
}

export interface BulkCreateResult {
    success: number;
    failed: number;
    errors: string[];
}

export const kpiLibraryApi = {
    findAll: async (query: QueryKPIDefinitionDto) => {
        const response = await apiClient.get('/kpi-library', { params: query });
        return response.data;
    },

    findOne: async (id: string): Promise<KPIDefinition> => {
        const response = await apiClient.get(`/kpi-library/${id}`);
        return response.data;
    },

    getStatistics: async (): Promise<KPILibraryStats> => {
        const response = await apiClient.get('/kpi-library/statistics');
        return response.data;
    },

    create: async (data: Partial<KPIDefinition>) => {
        const response = await apiClient.post('/kpi-library', data);
        return response.data;
    },

    update: async (id: string, data: Partial<KPIDefinition>) => {
        const response = await apiClient.put(`/kpi-library/${id}`, data);
        return response.data;
    },

    remove: async (id: string) => {
        const response = await apiClient.delete(`/kpi-library/${id}`);
        return response.data;
    },

    bulkCreate: async (definitions: Partial<KPIDefinition>[]): Promise<BulkCreateResult> => {
        const response = await apiClient.post('/kpi-library/bulk', definitions);
        return response.data;
    },
};
