import { apiClient } from './client';

export interface CalibrationSession {
  id: string;
  periodId: string;
  period?: { name: string };
  name: string;
  status: 'draft' | 'in_progress' | 'completed';
  scheduledAt?: string;
  completedAt?: string;
  facilitatorId: string;
  facilitator?: { username: string };
  participants: string[];
  notes?: string;
  createdAt: string;
}

export interface CalibrationAdjustment {
  id: string;
  sessionId: string;
  employeeId: string;
  employee?: { name: string; department?: { name: string } };
  originalScore: number;
  adjustedScore: number;
  originalGrade?: string;
  adjustedGrade?: string;
  reason?: string;
  adjustedBy?: { username: string };
  createdAt: string;
}

export const calibrationApi = {
  getSessions: (periodId?: string) =>
    apiClient.get<CalibrationSession[]>('/calibration/sessions', { params: { periodId } }).then(r => r.data),
  
  createSession: (data: { periodId: string; name: string; scheduledAt?: string; participants?: string[] }) =>
    apiClient.post<CalibrationSession>('/calibration/sessions', data).then(r => r.data),
  
  updateSession: (id: string, data: Partial<CalibrationSession>) =>
    apiClient.put<CalibrationSession>(`/calibration/sessions/${id}`, data).then(r => r.data),
  
  getSessionDetail: (id: string) =>
    apiClient.get<CalibrationSession & { adjustments: CalibrationAdjustment[] }>(`/calibration/sessions/${id}`).then(r => r.data),
  
  adjustScore: (sessionId: string, data: { employeeId: string; adjustedScore: number; reason?: string }) =>
    apiClient.post<CalibrationAdjustment>(`/calibration/sessions/${sessionId}/adjust`, data).then(r => r.data),
  
  batchAdjust: (sessionId: string, adjustments: Array<{ employeeId: string; adjustedScore: number; reason?: string }>) =>
    apiClient.post(`/calibration/sessions/${sessionId}/batch-adjust`, { adjustments }).then(r => r.data),
  
  getDistribution: (periodId: string) =>
    apiClient.get(`/calibration/distribution/${periodId}`).then(r => r.data),
};
