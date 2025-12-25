import { apiClient } from './client';

export interface MyKPIItem {
  assignmentId: string;
  kpiCode: string;
  kpiName: string;
  unit?: string;
  targetValue: number;
  challengeValue?: number;
  actualValue?: number;
  score?: number;
  weight: number;
  formulaType: string;
}

export interface MyPerformanceSummary {
  periodId: string;
  periodName: string;
  totalScore: number;
  rank?: number;
  totalInTeam?: number;
  status: 'excellent' | 'good' | 'average' | 'poor';
  kpiCount: number;
  completedCount: number;
}

export interface MyTrendData {
  periodName: string;
  score: number;
}

export interface SelfEvaluationEntry {
  assignmentId: string;
  actualValue: number;
  remark?: string;
}

export const myApi = {
  getDashboard: async (periodId?: string): Promise<MyPerformanceSummary> => {
    const res = await apiClient.get('/my/dashboard', { params: { periodId } });
    return res.data;
  },

  getMyKPIs: async (periodId: string): Promise<MyKPIItem[]> => {
    const res = await apiClient.get('/my/kpis', { params: { periodId } });
    return res.data;
  },

  getMyTrend: async (periodCount = 6): Promise<MyTrendData[]> => {
    const res = await apiClient.get('/my/trend', { params: { periodCount } });
    return res.data;
  },

  submitSelfEvaluation: async (periodId: string, entries: SelfEvaluationEntry[]): Promise<void> => {
    await apiClient.post('/my/self-evaluation', { periodId, entries });
  },

  getSelfEvaluationStatus: async (periodId: string): Promise<{ submitted: boolean; submittedAt?: string; status?: string }> => {
    const res = await apiClient.get('/my/self-evaluation/status', { params: { periodId } });
    return res.data;
  },
};
