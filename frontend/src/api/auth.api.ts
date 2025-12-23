import { apiClient, setToken, removeToken } from './client';

export interface LoginData {
  username: string; // 用户名登录
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  companyId: string;
  groupId?: string;
  company?: { id: string; name: string };
  department?: { id: string; name: string };
  language: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export const authApi = {
  async login(data: LoginData): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    setToken(res.data.accessToken);
    return res.data;
  },

  async getMe(): Promise<AuthUser & { company: { id: string; name: string } }> {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  logout() {
    removeToken();
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const res = await apiClient.post('/auth/reset-password', { token, newPassword });
    return res.data;
  },
};
