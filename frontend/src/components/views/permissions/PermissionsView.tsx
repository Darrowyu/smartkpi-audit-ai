import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Save, RotateCcw, Target, Calendar, FileSpreadsheet, FileText, Users, Settings, Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { UserRole } from '@/types';
import { permissionsApi } from '@/api/permissions.api';
import { cn } from '@/lib/utils';

interface Permission {
    id: string;
    name: string;
    description: string;
    module: string;
}

interface RolePermissions {
    [role: string]: string[];
}

// 角色卡片
interface RoleCardProps {
    role: UserRole;
    isSelected: boolean;
    onClick: () => void;
    permissionCount: number;
}

const RoleCard: React.FC<RoleCardProps> = ({ role, isSelected, onClick, permissionCount }) => {
    const roleConfig: Record<UserRole, { name: string; color: string; bg: string; desc: string }> = {
        [UserRole.SUPER_ADMIN]: { name: '超级管理员', color: 'text-red-600', bg: 'bg-red-50', desc: '拥有所有权限' },
        [UserRole.GROUP_ADMIN]: { name: '集团管理员', color: 'text-purple-600', bg: 'bg-purple-50', desc: '管理集团内所有公司' },
        [UserRole.MANAGER]: { name: '部门经理', color: 'text-blue-600', bg: 'bg-blue-50', desc: '管理部门绩效' },
        [UserRole.USER]: { name: '普通用户', color: 'text-slate-600', bg: 'bg-slate-50', desc: '查看个人绩效' },
    };

    const config = roleConfig[role];

    return (
        <div
            className={cn(
                'p-3 lg:p-4 rounded-xl border-2 cursor-pointer transition-all flex-shrink-0 w-[160px] lg:w-auto',
                isSelected ? 'border-[#1E4B8E] bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
            )}
            onClick={onClick}
        >
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-3">
                <div className={cn('w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center', config.bg)}>
                    <Shield className={cn('w-4 h-4 lg:w-5 lg:h-5', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={cn('font-semibold text-sm lg:text-base truncate', config.color)}>{config.name}</p>
                    <p className="text-[10px] lg:text-xs text-slate-500 truncate">{config.desc}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] lg:text-xs self-start lg:self-auto">
                    {permissionCount}
                </Badge>
            </div>
        </div>
    );
};

// 权限项
interface PermissionItemProps {
    permission: Permission;
    isGranted: boolean;
    onToggle: () => void;
    disabled: boolean;
}

const PermissionItem: React.FC<PermissionItemProps> = ({ permission, isGranted, onToggle, disabled }) => (
    <div className={cn(
        'flex items-center justify-between p-3 sm:p-4 rounded-xl transition-colors gap-3',
        isGranted ? 'bg-emerald-50' : 'bg-slate-50'
    )}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className={cn(
                'w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                isGranted ? 'bg-emerald-100' : 'bg-slate-200'
            )}>
                {isGranted ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                ) : (
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                )}
            </div>
            <div className="min-w-0">
                <p className="font-medium text-slate-900 text-sm sm:text-base truncate">{permission.name}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate">{permission.description}</p>
            </div>
        </div>
        <Switch checked={isGranted} onCheckedChange={onToggle} disabled={disabled} className="flex-shrink-0" />
    </div>
);

export const PermissionsView: React.FC = () => {
    const { t } = useTranslation();

    const modules = useMemo(() => [
        { id: 'kpi-library', name: '指标库', icon: Target, color: 'text-blue-600' },
        { id: 'assessment', name: '考核周期', icon: Calendar, color: 'text-purple-600' },
        { id: 'data-entry', name: '数据填报', icon: FileSpreadsheet, color: 'text-emerald-600' },
        { id: 'reports', name: '报表分析', icon: FileText, color: 'text-amber-600' },
        { id: 'users', name: '用户管理', icon: Users, color: 'text-red-600' },
        { id: 'settings', name: '系统设置', icon: Settings, color: 'text-slate-600' },
    ], []);

    const allPermissions: Permission[] = useMemo(() => [
        { id: 'kpi:view', name: '查看指标', description: '查看KPI指标库', module: 'kpi-library' },
        { id: 'kpi:create', name: '创建指标', description: '创建新的KPI指标', module: 'kpi-library' },
        { id: 'kpi:edit', name: '编辑指标', description: '编辑已有KPI指标', module: 'kpi-library' },
        { id: 'kpi:delete', name: '删除指标', description: '删除KPI指标', module: 'kpi-library' },
        { id: 'period:view', name: '查看周期', description: '查看考核周期列表', module: 'assessment' },
        { id: 'period:create', name: '创建周期', description: '创建新的考核周期', module: 'assessment' },
        { id: 'period:lock', name: '锁定周期', description: '锁定考核周期', module: 'assessment' },
        { id: 'data:view', name: '查看数据', description: '查看填报数据', module: 'data-entry' },
        { id: 'data:submit', name: '提交数据', description: '提交绩效数据', module: 'data-entry' },
        { id: 'data:approve', name: '审批数据', description: '审批提交的数据', module: 'data-entry' },
        { id: 'report:view', name: '查看报表', description: '查看绩效报表', module: 'reports' },
        { id: 'report:export', name: '导出报表', description: '导出绩效报表', module: 'reports' },
        { id: 'user:view', name: '查看用户', description: '查看用户列表', module: 'users' },
        { id: 'user:create', name: '创建用户', description: '创建新用户', module: 'users' },
        { id: 'user:edit', name: '编辑用户', description: '编辑用户信息', module: 'users' },
        { id: 'user:delete', name: '删除用户', description: '删除用户', module: 'users' },
        { id: 'settings:view', name: '查看设置', description: '查看系统设置', module: 'settings' },
        { id: 'settings:edit', name: '编辑设置', description: '修改系统设置', module: 'settings' },
    ], []);

    const [rolePermissions, setRolePermissions] = useState<RolePermissions>({});
    const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.MANAGER);
    const [hasChanges, setHasChanges] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeModule, setActiveModule] = useState('kpi-library');
    const { toast } = useToast();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const roles = await permissionsApi.getRolePermissions();
            setRolePermissions(roles);
        } catch {
            // 静默处理
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
            toast({ title: '保存成功', description: '权限配置已更新' });
            setHasChanges(false);
        } catch {
            toast({ variant: 'destructive', title: '保存失败' });
        }
    };

    const handleReset = async () => {
        if (!confirm('确定要重置为默认权限配置吗？')) return;
        try {
            await permissionsApi.resetToDefault();
            toast({ title: '重置成功' });
            await loadData();
            setHasChanges(false);
        } catch {
            toast({ variant: 'destructive', title: '重置失败' });
        }
    };

    const getPermissionsByModule = (moduleId: string) => allPermissions.filter(p => p.module === moduleId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E4B8E]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">权限管理</h1>
                    <p className="text-slate-500">配置不同角色的系统访问权限</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReset} disabled={isLoading}>
                        <RotateCcw className="mr-2 h-4 w-4" /> 重置默认
                    </Button>
                    <Button onClick={handleSave} disabled={!hasChanges || isLoading}>
                        <Save className="mr-2 h-4 w-4" /> 保存更改
                    </Button>
                </div>
            </div>

            {/* 角色选择 - 移动端横向滚动 */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-700">选择角色</h3>
                <div className="flex lg:grid lg:grid-cols-4 gap-3 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                    {Object.values(UserRole).map((role) => (
                        <RoleCard
                            key={role}
                            role={role}
                            isSelected={selectedRole === role}
                            onClick={() => setSelectedRole(role)}
                            permissionCount={(rolePermissions[role] || []).length}
                        />
                    ))}
                </div>
            </div>

            {/* 权限配置 */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                权限配置
                                <Badge variant="outline">{selectedRole}</Badge>
                            </CardTitle>
                            <CardDescription>
                                已授权 {(rolePermissions[selectedRole] || []).length} / {allPermissions.length} 项权限
                            </CardDescription>
                        </div>
                        {selectedRole === UserRole.SUPER_ADMIN && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 whitespace-nowrap self-start sm:self-auto">
                                超级管理员拥有所有权限
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeModule} onValueChange={setActiveModule}>
                        {/* Tab导航 - 横向滚动 */}
                        <div className="overflow-x-auto -mx-6 px-6 mb-6">
                            <TabsList className="inline-flex w-max lg:w-full lg:grid lg:grid-cols-6">
                                {modules.map((mod) => {
                                    const Icon = mod.icon;
                                    const modulePerms = getPermissionsByModule(mod.id);
                                    const grantedCount = modulePerms.filter(p => hasPermission(p.id)).length;
                                    return (
                                        <TabsTrigger key={mod.id} value={mod.id} className="text-xs sm:text-sm whitespace-nowrap px-3">
                                            <Icon className={cn('w-4 h-4 mr-1.5', mod.color)} />
                                            <span className="hidden sm:inline">{mod.name}</span>
                                            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">
                                                {grantedCount}/{modulePerms.length}
                                            </Badge>
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>
                        </div>

                        {modules.map((mod) => (
                            <TabsContent key={mod.id} value={mod.id} className="space-y-3 mt-0">
                                {getPermissionsByModule(mod.id).map((perm) => (
                                    <PermissionItem
                                        key={perm.id}
                                        permission={perm}
                                        isGranted={hasPermission(perm.id)}
                                        onToggle={() => togglePermission(perm.id)}
                                        disabled={selectedRole === UserRole.SUPER_ADMIN || isLoading}
                                    />
                                ))}
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};
