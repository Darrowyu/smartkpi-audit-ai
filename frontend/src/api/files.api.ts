import { apiClient } from './client';

export interface UploadedFile {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  rowCount?: number;
  createdAt: string;
  uploadedBy: { id: string; email: string; firstName?: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const filesApi = {
  async upload(file: File, description?: string): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);

    const res = await apiClient.post<UploadedFile>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async getFiles(page = 1, limit = 10): Promise<PaginatedResponse<UploadedFile>> {
    const res = await apiClient.get('/files', { params: { page, limit } });
    return res.data;
  },

  async getFile(id: string): Promise<UploadedFile> {
    const res = await apiClient.get(`/files/${id}`);
    return res.data;
  },

  async deleteFile(id: string): Promise<void> {
    await apiClient.delete(`/files/${id}`);
  },

  getDownloadUrl(id: string): string {
    return `${apiClient.defaults.baseURL}/files/${id}/download`;
  },
};
