import { apiClient } from './client';

export interface ProgressCheckIn {
  id: string;
  periodId: string;
  employeeId: string;
  employee?: { name: string; department?: { name: string } };
  checkInDate: string;
  progressPercentage: number;
  blockers?: string;
  achievements?: string;
  nextSteps?: string;
  riskLevel: 'low' | 'medium' | 'high';
  managerComment?: string;
  createdById: string;
  createdBy?: { username: string };
  createdAt: string;
}

export interface RiskAlert {
  employeeId: string;
  employee: { name: string; department?: { name: string } };
  riskLevel: string;
  progressPercentage: number;
  lastCheckIn?: string;
  daysSinceLastCheckIn: number;
}

export const checkinApi = {
  getCheckIns: (periodId: string, employeeId?: string) =>
    apiClient.get<ProgressCheckIn[]>('/checkins', { params: { periodId, employeeId } }).then(r => r.data),
  
  createCheckIn: (data: { periodId: string; employeeId: string; progressPercentage: number; blockers?: string; achievements?: string; nextSteps?: string; riskLevel?: string }) =>
    apiClient.post<ProgressCheckIn>('/checkins', data).then(r => r.data),
  
  updateCheckIn: (id: string, data: Partial<ProgressCheckIn>) =>
    apiClient.put<ProgressCheckIn>(`/checkins/${id}`, data).then(r => r.data),
  
  addManagerComment: (id: string, comment: string) =>
    apiClient.post(`/checkins/${id}/comment`, { comment }).then(r => r.data),
  
  getRiskAlerts: (periodId: string) =>
    apiClient.get<RiskAlert[]>(`/checkins/risks/${periodId}`).then(r => r.data),
  
  getMyCheckIns: (periodId: string) =>
    apiClient.get<ProgressCheckIn[]>('/checkins/my', { params: { periodId } }).then(r => r.data),
};
