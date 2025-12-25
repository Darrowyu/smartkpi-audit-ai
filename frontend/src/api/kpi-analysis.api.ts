import { apiClient } from './client';
import { KPIAnalysisResult, Language } from '../types';
import { PaginatedResponse } from './files.api';

type ApiLanguage = 'en' | 'zh';
const mapLanguage = (lang: Language | undefined): ApiLanguage => {
  if (lang === 'zh' || lang === 'zh-TW') return 'zh';
  if (lang === 'ja') return 'en'; // 日语fallback到英文
  return lang === 'en' ? 'en' : 'zh';
};

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
  async analyze(fileId: string, language?: Language, period?: string): Promise<KPIAnalysis> {
    const res = await apiClient.post(`/kpi-analysis/analyze/${fileId}`, { language: mapLanguage(language), period });
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
