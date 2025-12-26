import { apiClient } from './client';

export interface TalentAssessment {
  id: string;
  employeeId: string;
  employee?: { name: string; department?: { name: string } };
  periodId: string;
  performanceScore: number;
  potentialScore: number;
  gridPosition: string;
  gridLabel: string;
  createdAt: string;
}

export interface NineBoxData {
  grid: Record<string, TalentAssessment[]>;
  summary: { total: number; byPosition: Record<string, number> };
}

export const talentApi = {
  getNineBoxData: (periodId: string, departmentId?: string) =>
    apiClient.get<NineBoxData>('/talent/nine-box', { params: { periodId, departmentId } }).then(r => r.data),
  
  assessEmployee: (data: { employeeId: string; periodId: string; potentialScore: number }) =>
    apiClient.post<TalentAssessment>('/talent/assess', data).then(r => r.data),
  
  batchAssess: (assessments: Array<{ employeeId: string; periodId: string; potentialScore: number }>) =>
    apiClient.post('/talent/batch-assess', { assessments }).then(r => r.data),
  
  getEmployeeDetail: (employeeId: string, periodId: string) =>
    apiClient.get<TalentAssessment>(`/talent/employee/${employeeId}`, { params: { periodId } }).then(r => r.data),
};
