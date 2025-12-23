import { apiClient } from './client';
import { AssessmentPeriod } from '../types';

export interface PaginatedResponse<T> {
    data: T[];
    meta: { total: number; page: number; limit: number; totalPages: number };
}

export const assessmentApi = {
    // 考核周期管理
    getPeriods: async (): Promise<PaginatedResponse<AssessmentPeriod>> => {
        const response = await apiClient.get('/assessment/periods');
        return response.data;
    },

    createPeriod: async (data: Partial<AssessmentPeriod>) => {
        const response = await apiClient.post('/assessment/periods', data);
        return response.data;
    },

    lockPeriod: async (id: string) => {
        const response = await apiClient.post(`/assessment/periods/${id}/lock`, {});
        return response.data;
    },

    // 模板下载
    downloadTemplate: async (periodId: string) => {
        const response = await apiClient.get(`/assessment/template/${periodId}`, {
            responseType: 'blob',
        });
        return response.data;
    },

    // 数据上传
    uploadData: async (periodId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('periodId', periodId);

        const response = await apiClient.post('/assessment/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
};
