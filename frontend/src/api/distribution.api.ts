import { apiClient } from './client';

export interface DistributionConfig {
  id: string;
  periodId?: string;
  distribution: Record<string, number>;
  scoreBoundaries: Record<string, { min: number; max: number }>;
  isEnforced: boolean;
  tolerance: number;
  createdAt: string;
}

export interface DistributionValidation {
  isValid: boolean;
  violations: Array<{ grade: string; expected: number; actual: number; difference: number }>;
  distribution: Record<string, { count: number; percentage: number }>;
}

export const distributionApi = {
  getConfig: (periodId?: string) =>
    apiClient.get<DistributionConfig>('/distribution/config', { params: { periodId } }).then(r => r.data),
  
  saveConfig: (data: { periodId?: string; distribution: Record<string, number>; scoreBoundaries?: Record<string, any>; isEnforced?: boolean; tolerance?: number }) =>
    apiClient.post<DistributionConfig>('/distribution/config', data).then(r => r.data),
  
  validate: (periodId: string) =>
    apiClient.get<DistributionValidation>(`/distribution/validate/${periodId}`).then(r => r.data),
  
  getStats: (periodId: string) =>
    apiClient.get(`/distribution/stats/${periodId}`).then(r => r.data),
};
