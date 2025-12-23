import { apiClient } from './client';
import { KPIAnalysisResult } from '../types';
import { PaginatedResponse } from './files.api';

export interface KPIAnalysis {
  id: string;
  summary: string;
  period: string;
  createdAt: string;
  file: { id: string; originalName: string };
  analyzedBy: { id: string; email: string; firstName?: string };
  employeeRecords?: any[];
  rawResult?: KPIAnalysisResult;
}

export interface AnalysisListItem {
  id: string;
  summary: string;
  period: string;
  createdAt: string;
  file: { id: string; originalName: string };
  analyzedBy: { id: string; email: string; firstName?: string };
  _count: { employeeRecords: number };
}

export const kpiAnalysisApi = {
  async analyze(fileId: string, language: 'en' | 'zh' = 'en', period?: string): Promise<KPIAnalysis> {
    const res = await apiClient.post(`/kpi-analysis/analyze/${fileId}`, { language, period });
    return res.data;
  },

  async getAnalyses(page = 1, limit = 10, period?: string): Promise<PaginatedResponse<AnalysisListItem>> {
    const res = await apiClient.get('/kpi-analysis', { params: { page, limit, period } });
    return res.data;
  },

  async getAnalysis(id: string): Promise<KPIAnalysis> {
    const res = await apiClient.get(`/kpi-analysis/${id}`);
    return res.data;
  },

  async deleteAnalysis(id: string): Promise<void> {
    await apiClient.delete(`/kpi-analysis/${id}`);
  },
};
