import { apiClient, setToken, removeToken } from './client';

export interface LoginData {
  username: string; // 用户名登录
  password: string;
}

export interface AuthUser {
  id: string;
  username: string; // 用户名
  email?: string; // 邮箱可选
  firstName?: string;
  lastName?: string;
  role: string;
  companyId: string;
  groupId?: string; // 集团ID（可选）
  company?: { id: string; name: string }; // 公司信息（可选）
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
};
