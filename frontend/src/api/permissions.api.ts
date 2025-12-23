import { apiClient } from './client';

export interface Permission {
    id: string;
    name: string;
    description: string;
    module: string;
}

export interface RolePermissions {
    [role: string]: string[];
}

export const permissionsApi = {
    /** 获取所有可用权限列表 */
    getAllPermissions: async (): Promise<Permission[]> => {
        const response = await apiClient.get('/permissions/all');
        return response.data;
    },

    /** 获取当前公司的角色权限配置 */
    getRolePermissions: async (): Promise<RolePermissions> => {
        const response = await apiClient.get('/permissions/config');
        return response.data;
    },

    /** 保存角色权限配置 */
    saveRolePermissions: async (rolePermissions: RolePermissions) => {
        const response = await apiClient.put('/permissions/config', { rolePermissions });
        return response.data;
    },

    /** 获取当前用户的权限列表 */
    getMyPermissions: async (): Promise<string[]> => {
        const response = await apiClient.get('/permissions/my');
        return response.data;
    },

    /** 重置为默认权限 */
    resetToDefault: async () => {
        const response = await apiClient.post('/permissions/reset');
        return response.data;
    },
};
