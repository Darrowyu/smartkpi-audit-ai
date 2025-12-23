import { apiClient } from './client';

export interface KPIAssignmentDto {
    id: string;
    kpiDefinitionId: string;
    kpiDefinition: {
        id: string;
        code: string;
        name: string;
        formulaType: string;
        unit?: string;
    };
    periodId: string;
    period?: { id: string; name: string; status: string };
    departmentId?: string;
    employeeId?: string;
    targetValue: number;
    challengeValue?: number;
    weight: number;
}

export interface CreateAssignmentDto {
    kpiDefinitionId: string;
    periodId: string;
    departmentId?: string;
    employeeId?: string;
    targetValue: number;
    challengeValue?: number;
    weight?: number;
}

export interface BulkAssignmentDto {
    periodId: string;
    assignments: Omit<CreateAssignmentDto, 'periodId'>[];
}

export interface QueryAssignmentDto {
    periodId?: string;
    departmentId?: string;
    employeeId?: string;
    page?: number;
    limit?: number;
}

export const assignmentApi = {
    create: async (data: CreateAssignmentDto): Promise<KPIAssignmentDto> => { // 创建单个分配
        const response = await apiClient.post('/assessment/assignments', data);
        return response.data;
    },

    bulkCreate: async (data: BulkAssignmentDto) => { // 批量创建
        const response = await apiClient.post('/assessment/assignments/bulk', data);
        return response.data;
    },

    findAll: async (query: QueryAssignmentDto) => { // 获取列表
        const response = await apiClient.get('/assessment/assignments', { params: query });
        return response.data;
    },

    findByPeriod: async (periodId: string): Promise<KPIAssignmentDto[]> => { // 按周期获取
        const response = await apiClient.get(`/assessment/assignments/period/${periodId}`);
        return response.data;
    },

    getDepartmentAssignments: async (periodId: string) => { // 获取部门分配汇总
        const response = await apiClient.get(`/assessment/assignments/departments/${periodId}`);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateAssignmentDto>): Promise<KPIAssignmentDto> => { // 更新
        const response = await apiClient.put(`/assessment/assignments/${id}`, data);
        return response.data;
    },

    remove: async (id: string) => { // 删除
        const response = await apiClient.delete(`/assessment/assignments/${id}`);
        return response.data;
    },

    copyFromPeriod: async (sourcePeriodId: string, targetPeriodId: string) => { // 复制分配
        const response = await apiClient.post('/assessment/assignments/copy', {
            sourcePeriodId,
            targetPeriodId,
        });
        return response.data;
    },
};
