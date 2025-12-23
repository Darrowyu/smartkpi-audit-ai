import { apiClient } from './client';

export interface PerformanceOverview {
    periodName: string;
    totalEmployees: number;
    avgScore: number;
    excellent: number;
    good: number;
    average: number;
    poor: number;
}

export interface DepartmentRanking {
    departmentId: string;
    departmentName: string;
    score: number;
    employeeCount: number;
    rank: number;
}

export interface EmployeeRanking {
    employeeId: string;
    employeeName: string;
    departmentName: string;
    score: number;
    status: string;
    rank: number;
}

export interface TrendData {
    period: string;
    avgScore: number;
    employeeCount: number;
}

export interface EmployeeDetail {
    employeeId: string;
    employeeName: string;
    departmentName: string;
    totalScore: number;
    status: string;
    metrics: { name: string; score: number; weight: number }[];
}

export const reportsApi = {
    getOverview: async (periodId: string): Promise<PerformanceOverview> => { // 获取周期概览
        const res = await apiClient.get(`/reports/overview/${periodId}`);
        return res.data;
    },

    getPeriodOverview: async (periodId: string): Promise<PerformanceOverview> => { // 别名
        return reportsApi.getOverview(periodId);
    },

    getDepartmentRanking: async (periodId: string): Promise<DepartmentRanking[]> => { // 获取部门排名
        const res = await apiClient.get(`/reports/departments/${periodId}`);
        return res.data;
    },

    getEmployeeRanking: async (periodId: string, page = 1, limit = 20): Promise<{ data: EmployeeRanking[]; total: number }> => { // 获取员工排名
        const res = await apiClient.get(`/reports/employees/${periodId}`, { params: { page, limit } });
        return res.data;
    },

    getTrend: async (periodCount = 6): Promise<TrendData[]> => { // 获取绩效趋势
        const res = await apiClient.get('/reports/trend', { params: { periodCount } });
        return res.data;
    },

    getPerformanceTrend: async (periodCount = 6): Promise<TrendData[]> => { // 别名
        return reportsApi.getTrend(periodCount);
    },

    getLowPerformanceAlerts: async (periodId: string, threshold = 60): Promise<EmployeeRanking[]> => { // 获取低绩效预警
        const res = await apiClient.get(`/reports/alerts/${periodId}`, { params: { threshold } });
        return res.data;
    },

    getEmployeeDetail: async (periodId: string, employeeId: string): Promise<EmployeeDetail> => { // 获取员工详情（含雷达图数据）
        const res = await apiClient.get(`/reports/employee/${periodId}/${employeeId}`);
        return res.data;
    },

    exportEmployees: async (periodId: string, format: 'xlsx' | 'csv' = 'xlsx'): Promise<Blob> => { // 导出员工绩效
        const res = await apiClient.get(`/reports/export/employees/${periodId}`, {
            params: { format },
            responseType: 'blob',
        });
        return res.data;
    },

    exportEmployeePerformance: async (periodId: string, format: 'xlsx' | 'csv' = 'xlsx'): Promise<Blob> => { // 别名
        return reportsApi.exportEmployees(periodId, format);
    },

    exportDepartments: async (periodId: string, format: 'xlsx' | 'csv' = 'xlsx'): Promise<Blob> => { // 导出部门绩效
        const res = await apiClient.get(`/reports/export/departments/${periodId}`, {
            params: { format },
            responseType: 'blob',
        });
        return res.data;
    },

    exportDepartmentPerformance: async (periodId: string, format: 'xlsx' | 'csv' = 'xlsx'): Promise<Blob> => { // 别名
        return reportsApi.exportDepartments(periodId, format);
    },
};
