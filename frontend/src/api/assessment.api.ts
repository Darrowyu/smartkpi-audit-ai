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

    updatePeriod: async (id: string, data: Partial<AssessmentPeriod>) => {
        const response = await apiClient.put(`/assessment/periods/${id}`, data);
        return response.data;
    },

    lockPeriod: async (id: string) => {
        const response = await apiClient.post(`/assessment/periods/${id}/lock`, {});
        return response.data;
    },

    activatePeriod: async (id: string) => {
        const response = await apiClient.post(`/assessment/periods/${id}/activate`, {});
        return response.data;
    },

    archivePeriod: async (id: string) => {
        const response = await apiClient.put(`/assessment/periods/${id}`, { status: 'ARCHIVED' });
        return response.data;
    },

    deletePeriod: async (id: string) => {
        const response = await apiClient.delete(`/assessment/periods/${id}`);
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

    // 审批流程
    submitForApproval: async (submissionId: string) => {
        const response = await apiClient.post(`/assessment/submissions/${submissionId}/submit`);
        return response.data;
    },

    approveSubmission: async (submissionId: string) => {
        const response = await apiClient.post(`/assessment/submissions/${submissionId}/approve`);
        return response.data;
    },

    rejectSubmission: async (submissionId: string, reason: string) => {
        const response = await apiClient.post(`/assessment/submissions/${submissionId}/reject`, { reason });
        return response.data;
    },

    getSubmissions: async (periodId?: string) => {
        const response = await apiClient.get('/assessment/submissions', { params: { periodId } });
        return response.data;
    },
};
