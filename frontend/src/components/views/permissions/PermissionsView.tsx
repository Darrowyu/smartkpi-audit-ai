import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Save, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import { UserRole } from '@/types';
import { permissionsApi } from '@/api/permissions.api';

// 权限定义
interface Permission {
    id: string;
    name: string;
    description: string;
    module: string;
}

// 角色权限映射
interface RolePermissions {
    [role: string]: string[];
}

// 模块定义
const modules = [
    { id: 'kpi-library', name: 'KPI 指标库', icon: '📊' },
    { id: 'assessment', name: '考核周期', icon: '📅' },
    { id: 'data-entry', name: '数据填报', icon: '📝' },
    { id: 'reports', name: '报表中心', icon: '📈' },
    { id: 'users', name: '用户管理', icon: '👥' },
    { id: 'settings', name: '系统设置', icon: '⚙️' },
];

const permissions: Permission[] = [
    // KPI 指标库
    { id: 'kpi:view', name: '查看指标', description: '查看 KPI 指标库', module: 'kpi-library' },
    { id: 'kpi:create', name: '创建指标', description: '创建新的 KPI 指标', module: 'kpi-library' },
    { id: 'kpi:edit', name: '编辑指标', description: '修改现有 KPI 指标', module: 'kpi-library' },
    { id: 'kpi:delete', name: '删除指标', description: '删除 KPI 指标', module: 'kpi-library' },

    // 考核周期
    { id: 'period:view', name: '查看周期', description: '查看考核周期', module: 'assessment' },
    { id: 'period:create', name: '创建周期', description: '创建新的考核周期', module: 'assessment' },
    { id: 'period:lock', name: '锁定周期', description: '锁定考核周期', module: 'assessment' },

    // 数据填报
    { id: 'data:view', name: '查看数据', description: '查看填报数据', module: 'data-entry' },
    { id: 'data:submit', name: '提交数据', description: '提交填报数据', module: 'data-entry' },
    { id: 'data:approve', name: '审批数据', description: '审批填报数据', module: 'data-entry' },

    // 报表
    { id: 'report:view', name: '查看报表', description: '查看绩效报表', module: 'reports' },
    { id: 'report:export', name: '导出报表', description: '导出绩效数据', module: 'reports' },

    // 用户管理
    { id: 'user:view', name: '查看用户', description: '查看用户列表', module: 'users' },
    { id: 'user:create', name: '创建用户', description: '创建新用户', module: 'users' },
    { id: 'user:edit', name: '编辑用户', description: '修改用户信息', module: 'users' },
    { id: 'user:delete', name: '删除用户', description: '删除用户', module: 'users' },

    // 系统设置
    { id: 'settings:view', name: '查看设置', description: '查看系统设置', module: 'settings' },
    { id: 'settings:edit', name: '修改设置', description: '修改系统设置', module: 'settings' },
];

export const PermissionsView: React.FC = () => {
    const [allPermissions, setAllPermissions] = useState<Permission[]>(permissions);
    const [rolePermissions, setRolePermissions] = useState<RolePermissions>({});
    const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.MANAGER);
    const [hasChanges, setHasChanges] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [perms, roles] = await Promise.all([
                permissionsApi.getAllPermissions(),
                permissionsApi.getRolePermissions()
            ]);
            setAllPermissions(perms);
            setRolePermissions(roles);
        } catch (error) {
            console.error('Failed to load permissions:', error);
            // 这里不阻塞，使用默认的 permissions 列表
            setAllPermissions(permissions);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePermission = (permissionId: string) => {
        setRolePermissions(prev => {
            const current = prev[selectedRole] || [];
            const updated = current.includes(permissionId)
                ? current.filter(p => p !== permissionId)
                : [...current, permissionId];
            return { ...prev, [selectedRole]: updated };
        });
        setHasChanges(true);
    };

    const hasPermission = (permissionId: string): boolean => {
        return (rolePermissions[selectedRole] || []).includes(permissionId);
    };

    const handleSave = async () => {
        try {
            await permissionsApi.saveRolePermissions(rolePermissions);
            toast({ title: '权限配置已保存', description: '系统权限规则已更新' });
            setHasChanges(false);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: '保存失败', description: '请稍后重试' });
        }
    };

    const handleReset = async () => {
        if (!confirm('确定要重置为系统默认权限吗？这将覆盖所有自定义配置。')) return;
        try {
            await permissionsApi.resetToDefault();
            toast({ title: '已重置', description: '权限配置已恢复为默认值' });
            await loadData();
            setHasChanges(false);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: '重置失败', description: '请稍后重试' });
        }
    };

    const getPermissionsByModule = (moduleId: string) => {
        return allPermissions.filter(p => p.module === moduleId);
    };

    if (isLoading) {
        return <div>加载权限配置中...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">权限管理</h2>
                    <p className="text-muted-foreground">配置不同角色的系统访问权限</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={handleReset} disabled={isLoading}>
                        <RotateCcw className="mr-2 h-4 w-4" /> 重置默认
                    </Button>
                    <Button onClick={handleSave} disabled={!hasChanges || isLoading}>
                        <Save className="mr-2 h-4 w-4" /> 保存更改
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                {/* 角色选择卡片 */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">选择角色</CardTitle>
                        <CardDescription>选择要配置权限的角色</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {Object.values(UserRole).map((role) => (
                            <Button
                                key={role}
                                variant={selectedRole === role ? 'default' : 'outline'}
                                className="w-full justify-start"
                                onClick={() => setSelectedRole(role)}
                            >
                                <Shield className="mr-2 h-4 w-4" />
                                {role}
                            </Button>
                        ))}
                    </CardContent>
                </Card>

                {/* 权限配置表格 */}
                <Card className="md:col-span-3">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>
                                    <Badge variant="outline" className="mr-2">{selectedRole}</Badge>
                                    权限配置
                                </CardTitle>
                                <CardDescription>
                                    当前角色拥有 {(rolePermissions[selectedRole] || []).length} 项权限
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="kpi-library">
                            <TabsList className="mb-4">
                                {modules.map((mod) => (
                                    <TabsTrigger key={mod.id} value={mod.id}>
                                        {mod.icon} {mod.name}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {modules.map((mod) => (
                                <TabsContent key={mod.id} value={mod.id}>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>权限</TableHead>
                                                <TableHead>说明</TableHead>
                                                <TableHead className="w-24 text-center">状态</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {getPermissionsByModule(mod.id).map((perm) => (
                                                <TableRow key={perm.id}>
                                                    <TableCell className="font-medium">{perm.name}</TableCell>
                                                    <TableCell className="text-muted-foreground">{perm.description}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Switch
                                                            checked={hasPermission(perm.id)}
                                                            onCheckedChange={() => togglePermission(perm.id)}
                                                            disabled={selectedRole === UserRole.SUPER_ADMIN || isLoading}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

