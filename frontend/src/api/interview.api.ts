import { apiClient } from './client';

export interface PerformanceInterview {
  id: string;
  periodId: string;
  period?: { name: string };
  employeeId: string;
  employee?: { name: string; department?: { name: string } };
  interviewerId: string;
  interviewer?: { username: string };
  interviewerName?: string;
  scheduledAt?: string;
  conductedAt?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  summary?: string;
  employeeFeedback?: string;
  actionItems?: string;
  employeeConfirmed: boolean;
  employeeConfirmedAt?: string;
  createdAt: string;
}

export const interviewApi = {
  getInterviews: (periodId?: string, status?: string) =>
    apiClient.get<PerformanceInterview[]>('/interviews', { params: { periodId, status } }).then(r => r.data),
  
  scheduleInterview: (data: { periodId: string; employeeId: string; scheduledAt: string }) =>
    apiClient.post<PerformanceInterview>('/interviews', data).then(r => r.data),
  
  getInterviewDetail: (id: string) =>
    apiClient.get<PerformanceInterview>(`/interviews/${id}`).then(r => r.data),
  
  updateInterview: (id: string, data: Partial<PerformanceInterview>) =>
    apiClient.put<PerformanceInterview>(`/interviews/${id}`, data).then(r => r.data),
  
  conductInterview: (id: string, data: { summary: string; actionItems?: string }) =>
    apiClient.post<PerformanceInterview>(`/interviews/${id}/conduct`, data).then(r => r.data),
  
  employeeConfirm: (id: string, feedback?: string) =>
    apiClient.post<PerformanceInterview>(`/interviews/${id}/confirm`, { feedback }).then(r => r.data),
  
  cancelInterview: (id: string, reason?: string) =>
    apiClient.post<PerformanceInterview>(`/interviews/${id}/cancel`, { reason }).then(r => r.data),
  
  getMyInterviews: () => apiClient.get<PerformanceInterview[]>('/interviews/my').then(r => r.data),
};
