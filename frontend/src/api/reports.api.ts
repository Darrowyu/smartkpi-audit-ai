import { apiClient } from './client';

export const reportsApi = {
    getOverview: async (periodId: string) => {
        const response = await apiClient.get(`/reports/overview/${periodId}`);
        return response.data;
    },

    getDepartmentRanking: async (periodId: string) => {
        const response = await apiClient.get(`/reports/department-ranking/${periodId}`);
        return response.data;
    },

    getEmployeeRanking: async (periodId: string, page = 1, limit = 20) => {
        const response = await apiClient.get(`/reports/employee-ranking/${periodId}`, {
            params: { page, limit },
        });
        return response.data;
    },

    getTrend: async (periodCount = 6) => {
        const response = await apiClient.get('/reports/trend', {
            params: { periodCount },
        });
        return response.data;
    },

    exportEmployees: async (periodId: string, format: 'xlsx' | 'csv' = 'xlsx') => {
        const response = await apiClient.get(`/reports/export/employees/${periodId}`, {
            params: { format },
            responseType: 'blob',
        });
        return response.data;
    },
};
