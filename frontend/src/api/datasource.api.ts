import { apiClient } from './client';

export interface DataSourceConfig {
  id: string;
  name: string;
  type: string;
  connectionConfig: Record<string, any>;
  fieldMapping: Record<string, any>;
  syncFrequency: string;
  isActive: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  createdAt: string;
}

export interface DataSyncLog {
  id: string;
  dataSourceId: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'success' | 'failed';
  recordsProcessed?: number;
  errorMessage?: string;
  createdAt: string;
}

export const datasourceApi = {
  getDataSources: () =>
    apiClient.get<DataSourceConfig[]>('/datasources').then(r => r.data),
  
  createDataSource: (data: { name: string; type: string; connectionConfig: Record<string, any>; fieldMapping: Record<string, any>; syncFrequency?: string }) =>
    apiClient.post<DataSourceConfig>('/datasources', data).then(r => r.data),
  
  getDataSource: (id: string) =>
    apiClient.get<DataSourceConfig>(`/datasources/${id}`).then(r => r.data),
  
  updateDataSource: (id: string, data: Partial<DataSourceConfig>) =>
    apiClient.put<DataSourceConfig>(`/datasources/${id}`, data).then(r => r.data),
  
  deleteDataSource: (id: string) =>
    apiClient.delete(`/datasources/${id}`).then(r => r.data),
  
  testConnection: (id: string) =>
    apiClient.post<{ success: boolean; message: string }>(`/datasources/${id}/test`).then(r => r.data),
  
  triggerSync: (id: string) =>
    apiClient.post<{ logId: string; message: string }>(`/datasources/${id}/sync`).then(r => r.data),
  
  getSyncLogs: (dataSourceId?: string) =>
    apiClient.get<DataSyncLog[]>('/datasources/logs', { params: { dataSourceId } }).then(r => r.data),
  
  getSyncStatus: (logId: string) =>
    apiClient.get<DataSyncLog>(`/datasources/logs/${logId}`).then(r => r.data),
};
