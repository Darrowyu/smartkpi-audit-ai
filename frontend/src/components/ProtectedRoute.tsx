import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePermission, useIsAdmin } from '@/hooks/usePermission';

interface ProtectedRouteProps {
    children: React.ReactNode;
    permission?: string; // 所需权限ID
    requiredRoles?: string[]; // 所需角色
    adminOnly?: boolean; // 仅管理员
    fallbackPath?: string; // 无权限时重定向
}

/** 受保护路由组件：未满足权限要求时重定向 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    permission,
    requiredRoles,
    adminOnly,
    fallbackPath = '/dashboard',
}) => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const hasPermission = usePermission(permission || '');
    const isAdmin = useIsAdmin();

    if (isLoading) return null; // 加载中不渲染

    if (!isAuthenticated) return <Navigate to="/login" replace />; // 未登录

    if (adminOnly && !isAdmin) return <Navigate to={fallbackPath} replace />; // 非管理员

    if (requiredRoles && user && !requiredRoles.includes(user.role)) { // 角色检查
        return <Navigate to={fallbackPath} replace />;
    }

    if (permission && !hasPermission) return <Navigate to={fallbackPath} replace />; // 权限检查

    return <>{children}</>;
};
