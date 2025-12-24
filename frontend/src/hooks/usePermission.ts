import { useAuth } from '@/context/AuthContext';

/** 检查用户是否拥有特定权限 */
export const usePermission = (permission: string): boolean => {
    const { user } = useAuth();
    return user?.permissions?.includes(permission) ?? false;
};

/** 检查用户是否拥有任一权限 */
export const useHasAnyPermission = (permissions: string[]): boolean => {
    const { user } = useAuth();
    if (!user?.permissions) return false;
    return permissions.some(p => user.permissions!.includes(p));
};

/** 检查用户是否拥有所有权限 */
export const useHasAllPermissions = (permissions: string[]): boolean => {
    const { user } = useAuth();
    if (!user?.permissions) return false;
    return permissions.every(p => user.permissions!.includes(p));
};

/** 检查用户是否为管理员角色 */
export const useIsAdmin = (): boolean => {
    const { user } = useAuth();
    return user?.role === 'GROUP_ADMIN' || user?.role === 'SUPER_ADMIN';
};

/** 检查用户是否为经理或更高角色 */
export const useIsManager = (): boolean => {
    const { user } = useAuth();
    return user?.role === 'MANAGER' || user?.role === 'GROUP_ADMIN' || user?.role === 'SUPER_ADMIN';
};
