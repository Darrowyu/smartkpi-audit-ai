import { apiClient } from './client';

export interface CalculationResult {
    periodId: string;
    employeeCount: number;
    departmentCount: number;
    totalTime: number;
}

export interface JobStatus {
    id: string;
    progress: number;
    state: string;
    result: any;
}

export const calculationApi = {
    /** 触发异步计算任务 */
    triggerCalculation: async (periodId: string) => {
        const response = await apiClient.post(`/calculation/trigger/${periodId}`);
        return response.data as { jobId: string; message: string };
    },

    /** 立即执行同步计算 */
    executeCalculation: async (periodId: string) => {
        const response = await apiClient.post(`/calculation/execute/${periodId}`);
        return response.data as CalculationResult;
    },

    /** 获取计算结果 */
    getResults: async (periodId: string) => {
        const response = await apiClient.get(`/calculation/results/${periodId}`);
        return response.data;
    },

    /** 获取任务状态 */
    getJobStatus: async (jobId: string) => {
        const response = await apiClient.get(`/calculation/job/${jobId}`);
        return response.data as JobStatus;
    },
};
