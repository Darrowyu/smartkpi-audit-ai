import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Save, RotateCcw, Target, Calendar, FileSpreadsheet, FileText, Users, Settings, Check, X, ClipboardList, CheckSquare, ClipboardCheck, MessageSquare, Scale, PieChart, Grid3X3, DollarSign, Database, Building2, Building, UserCog, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
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

interface Module {
    id: string;
    name: string;
    icon: React.ElementType;
    color: string;
}

interface ModuleGroup {
    id: string;
    name: string;
    modules: Module[];
}

interface RolePermissions {
    [role: string]: string[];
}

// 角色卡片
const RoleCard: React.FC<{
    role: UserRole;
    isSelected: boolean;
    onClick: () => void;
    permissionCount: number;
    totalCount: number;
}> = ({ role, isSelected, onClick, permissionCount, totalCount }) => {
    const roleConfig: Record<UserRole, { name: string; color: string; bg: string; desc: string }> = {
        [UserRole.SUPER_ADMIN]: { name: '超级管理员', color: 'text-red-600', bg: 'bg-red-50', desc: '拥有所有权限' },
        [UserRole.GROUP_ADMIN]: { name: '集团管理员', color: 'text-purple-600', bg: 'bg-purple-50', desc: '管理集团内所有公司' },
        [UserRole.MANAGER]: { name: '部门经理', color: 'text-blue-600', bg: 'bg-blue-50', desc: '管理部门绩效' },
        [UserRole.USER]: { name: '普通用户', color: 'text-slate-600', bg: 'bg-slate-50', desc: '查看个人绩效' },
    };
    const config = roleConfig[role];
    const isComplete = permissionCount === totalCount;

    return (
        <div
            className={cn(
                'p-3 lg:p-4 rounded-xl border-2 cursor-pointer transition-all flex-shrink-0 w-[160px] lg:w-auto',
                isSelected ? 'border-brand-primary bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
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
                <Badge variant={isComplete ? 'default' : 'secondary'} className={cn('text-[10px] lg:text-xs self-start lg:self-auto', isComplete && 'bg-emerald-500')}>
                    {permissionCount}/{totalCount}
                </Badge>
            </div>
        </div>
    );
};

export const PermissionsView: React.FC = () => {
    const { t } = useTranslation();

    // 模块定义
    const allModules: Module[] = useMemo(() => [
        { id: 'kpi-library', name: '指标库', icon: Target, color: 'text-blue-600' },
        { id: 'assessment', name: '考核周期', icon: Calendar, color: 'text-purple-600' },
        { id: 'assignment', name: '指标分配', icon: ClipboardList, color: 'text-indigo-600' },
        { id: 'data-entry', name: '数据填报', icon: FileSpreadsheet, color: 'text-emerald-600' },
        { id: 'data-approval', name: '数据审批', icon: CheckSquare, color: 'text-teal-600' },
        { id: 'checkin', name: '签到', icon: ClipboardCheck, color: 'text-cyan-600' },
        { id: 'interview', name: '面谈', icon: MessageSquare, color: 'text-sky-600' },
        { id: 'reports', name: '报表分析', icon: FileText, color: 'text-amber-600' },
        { id: 'calibration', name: '校准', icon: Scale, color: 'text-orange-600' },
        { id: 'distribution', name: '强制分布', icon: PieChart, color: 'text-pink-600' },
        { id: 'talent', name: '人才盘点', icon: Grid3X3, color: 'text-rose-600' },
        { id: 'salary', name: '薪酬关联', icon: DollarSign, color: 'text-lime-600' },
        { id: 'organization', name: '组织管理', icon: Building2, color: 'text-fuchsia-600' },
        { id: 'department', name: '部门管理', icon: Building, color: 'text-red-600' },
        { id: 'employee', name: '员工管理', icon: UserCog, color: 'text-stone-600' },
        { id: 'users', name: '用户管理', icon: Users, color: 'text-red-600' },
        { id: 'datasource', name: '数据源', icon: Database, color: 'text-violet-600' },
        { id: 'permissions', name: '权限管理', icon: Shield, color: 'text-gray-600' },
        { id: 'settings', name: '系统设置', icon: Settings, color: 'text-slate-600' },
    ], []);

    // 分组定义
    const moduleGroups: ModuleGroup[] = useMemo(() => [
        {
            id: 'business',
            name: '业务功能',
            modules: allModules.filter(m => ['kpi-library', 'assessment', 'assignment', 'data-entry', 'data-approval', 'checkin', 'interview', 'reports'].includes(m.id))
        },
        {
            id: 'performance',
            name: '绩效管理',
            modules: allModules.filter(m => ['calibration', 'distribution', 'talent', 'salary'].includes(m.id))
        },
        {
            id: 'organization',
            name: '组织管理',
            modules: allModules.filter(m => ['organization', 'department', 'employee', 'users'].includes(m.id))
        },
        {
            id: 'system',
            name: '系统管理',
            modules: allModules.filter(m => ['datasource', 'permissions', 'settings'].includes(m.id))
        },
    ], [allModules]);

    // 权限定义
    const allPermissions: Permission[] = useMemo(() => [
        // 指标库
        { id: 'kpi:view', name: '查看指标', description: '查看KPI指标库', module: 'kpi-library' },
        { id: 'kpi:create', name: '创建指标', description: '创建新的KPI指标', module: 'kpi-library' },
        { id: 'kpi:edit', name: '编辑指标', description: '编辑已有KPI指标', module: 'kpi-library' },
        { id: 'kpi:delete', name: '删除指标', description: '删除KPI指标', module: 'kpi-library' },
        // 考核周期
        { id: 'period:view', name: '查看周期', description: '查看考核周期列表', module: 'assessment' },
        { id: 'period:create', name: '创建周期', description: '创建新的考核周期', module: 'assessment' },
        { id: 'period:edit', name: '编辑周期', description: '编辑考核周期信息', module: 'assessment' },
        { id: 'period:delete', name: '删除周期', description: '删除考核周期', module: 'assessment' },
        { id: 'period:lock', name: '锁定周期', description: '锁定考核周期', module: 'assessment' },
        { id: 'period:activate', name: '激活周期', description: '激活考核周期', module: 'assessment' },
        // 指标分配
        { id: 'assignment:view', name: '查看分配', description: '查看指标分配情况', module: 'assignment' },
        { id: 'assignment:create', name: '创建分配', description: '创建新的指标分配', module: 'assignment' },
        { id: 'assignment:edit', name: '编辑分配', description: '编辑指标分配', module: 'assignment' },
        { id: 'assignment:delete', name: '删除分配', description: '删除指标分配', module: 'assignment' },
        { id: 'assignment:copy', name: '复制分配', description: '从其他周期复制分配', module: 'assignment' },
        // 数据填报
        { id: 'data:view', name: '查看数据', description: '查看填报数据', module: 'data-entry' },
        { id: 'data:submit', name: '提交数据', description: '提交绩效数据', module: 'data-entry' },
        { id: 'data:edit', name: '编辑数据', description: '编辑填报数据', module: 'data-entry' },
        { id: 'data:import', name: '导入数据', description: '通过Excel导入数据', module: 'data-entry' },
        // 数据审批
        { id: 'approval:view', name: '查看审批', description: '查看待审批数据', module: 'data-approval' },
        { id: 'approval:approve', name: '审批通过', description: '审批通过提交的数据', module: 'data-approval' },
        { id: 'approval:reject', name: '审批驳回', description: '驳回提交的数据', module: 'data-approval' },
        // 签到
        { id: 'checkin:view', name: '查看签到', description: '查看签到记录', module: 'checkin' },
        { id: 'checkin:create', name: '创建签到', description: '创建签到记录', module: 'checkin' },
        { id: 'checkin:edit', name: '编辑签到', description: '编辑签到记录', module: 'checkin' },
        // 面谈
        { id: 'interview:view', name: '查看面谈', description: '查看面谈记录', module: 'interview' },
        { id: 'interview:create', name: '创建面谈', description: '创建面谈记录', module: 'interview' },
        { id: 'interview:edit', name: '编辑面谈', description: '编辑面谈记录', module: 'interview' },
        // 报表分析
        { id: 'report:view', name: '查看报表', description: '查看绩效报表', module: 'reports' },
        { id: 'report:export', name: '导出报表', description: '导出绩效报表', module: 'reports' },
        // 校准
        { id: 'calibration:view', name: '查看校准', description: '查看校准会议', module: 'calibration' },
        { id: 'calibration:edit', name: '编辑校准', description: '编辑校准结果', module: 'calibration' },
        // 强制分布
        { id: 'distribution:view', name: '查看分布', description: '查看强制分布', module: 'distribution' },
        { id: 'distribution:edit', name: '编辑分布', description: '编辑分布规则', module: 'distribution' },
        // 人才盘点
        { id: 'talent:view', name: '查看盘点', description: '查看人才盘点', module: 'talent' },
        { id: 'talent:edit', name: '编辑盘点', description: '编辑盘点结果', module: 'talent' },
        // 薪酬关联
        { id: 'salary:view', name: '查看薪酬', description: '查看薪酬关联', module: 'salary' },
        { id: 'salary:edit', name: '编辑薪酬', description: '编辑薪酬关联', module: 'salary' },
        // 组织管理
        { id: 'org:view', name: '查看组织', description: '查看集团/公司信息', module: 'organization' },
        { id: 'org:edit', name: '编辑组织', description: '编辑集团/公司设置', module: 'organization' },
        // 部门管理
        { id: 'dept:view', name: '查看部门', description: '查看部门列表', module: 'department' },
        { id: 'dept:create', name: '创建部门', description: '创建新部门', module: 'department' },
        { id: 'dept:edit', name: '编辑部门', description: '编辑部门信息', module: 'department' },
        { id: 'dept:delete', name: '删除部门', description: '删除部门', module: 'department' },
        // 员工管理
        { id: 'emp:view', name: '查看员工', description: '查看员工列表', module: 'employee' },
        { id: 'emp:create', name: '创建员工', description: '创建新员工', module: 'employee' },
        { id: 'emp:edit', name: '编辑员工', description: '编辑员工信息', module: 'employee' },
        { id: 'emp:delete', name: '删除员工', description: '删除员工', module: 'employee' },
        { id: 'emp:import', name: '导入员工', description: '批量导入员工', module: 'employee' },
        // 用户管理
        { id: 'user:view', name: '查看用户', description: '查看用户列表', module: 'users' },
        { id: 'user:create', name: '创建用户', description: '创建新用户', module: 'users' },
        { id: 'user:edit', name: '编辑用户', description: '编辑用户信息', module: 'users' },
        { id: 'user:delete', name: '删除用户', description: '删除用户', module: 'users' },
        // 数据源
        { id: 'datasource:view', name: '查看数据源', description: '查看数据源配置', module: 'datasource' },
        { id: 'datasource:create', name: '创建数据源', description: '创建新的数据源', module: 'datasource' },
        { id: 'datasource:edit', name: '编辑数据源', description: '编辑数据源配置', module: 'datasource' },
        { id: 'datasource:delete', name: '删除数据源', description: '删除数据源', module: 'datasource' },
        // 权限管理
        { id: 'perm:view', name: '查看权限', description: '查看权限配置', module: 'permissions' },
        { id: 'perm:edit', name: '编辑权限', description: '编辑权限配置', module: 'permissions' },
        { id: 'perm:reset', name: '重置权限', description: '重置为默认权限', module: 'permissions' },
        // 系统设置
        { id: 'settings:view', name: '查看设置', description: '查看系统设置', module: 'settings' },
        { id: 'settings:edit', name: '编辑设置', description: '修改系统设置', module: 'settings' },
    ], []);

    const [rolePermissions, setRolePermissions] = useState<RolePermissions>({});
    const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.MANAGER);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['business']);
    const [hasChanges, setHasChanges] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const confirm = useConfirm();

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

    const getPermissionsByModule = (moduleId: string) => allPermissions.filter(p => p.module === moduleId);

    const hasPermission = (permissionId: string): boolean => {
        return (rolePermissions[selectedRole] || []).includes(permissionId);
    };

    const getModulePermissionCount = (moduleId: string): { granted: number; total: number } => {
        const perms = getPermissionsByModule(moduleId);
        const granted = perms.filter(p => hasPermission(p.id)).length;
        return { granted, total: perms.length };
    };

    const getGroupPermissionCount = (group: ModuleGroup): { granted: number; total: number } => {
        let granted = 0, total = 0;
        group.modules.forEach(mod => {
            const count = getModulePermissionCount(mod.id);
            granted += count.granted;
            total += count.total;
        });
        return { granted, total };
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

    const toggleModulePermissions = (moduleId: string) => {
        const perms = getPermissionsByModule(moduleId);
        const permIds = perms.map(p => p.id);
        const currentPerms = rolePermissions[selectedRole] || [];
        const allGranted = permIds.every(id => currentPerms.includes(id));

        setRolePermissions(prev => {
            const current = prev[selectedRole] || [];
            let updated: string[];
            if (allGranted) {
                updated = current.filter(p => !permIds.includes(p));
            } else {
                updated = [...new Set([...current, ...permIds])];
            }
            return { ...prev, [selectedRole]: updated };
        });
        setHasChanges(true);
    };

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev =>
            prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
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
        const confirmed = await confirm({
            title: '重置权限',
            description: '确定要重置为默认权限配置吗？',
            variant: 'destructive',
        });
        if (!confirmed) return;
        try {
            await permissionsApi.resetToDefault();
            toast({ title: '重置成功' });
            await loadData();
            setHasChanges(false);
        } catch {
            toast({ variant: 'destructive', title: '重置失败' });
        }
    };

    const selectedModuleData = selectedModule ? allModules.find(m => m.id === selectedModule) : null;
    const selectedModulePerms = selectedModule ? getPermissionsByModule(selectedModule) : [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
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

            {/* 角色选择 */}
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
                            totalCount={allPermissions.length}
                        />
                    ))}
                </div>
            </div>

            {/* 权限配置 - 左右分栏 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 左侧：模块分组列表 */}
                <Card className="lg:col-span-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">功能模块</CardTitle>
                        <CardDescription>选择模块配置权限</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {moduleGroups.map((group) => {
                                const isExpanded = expandedGroups.includes(group.id);
                                const groupCount = getGroupPermissionCount(group);
                                const isComplete = groupCount.granted === groupCount.total;

                                return (
                                    <div key={group.id}>
                                        {/* 分组标题 */}
                                        <button
                                            onClick={() => toggleGroup(group.id)}
                                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                {isExpanded ? (
                                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                                )}
                                                <span className="font-medium text-slate-700">{group.name}</span>
                                            </div>
                                            <Badge variant={isComplete ? 'default' : 'secondary'} className={cn('text-xs', isComplete && 'bg-emerald-500')}>
                                                {groupCount.granted}/{groupCount.total}
                                            </Badge>
                                        </button>

                                        {/* 模块列表 */}
                                        {isExpanded && (
                                            <div className="bg-slate-50/50">
                                                {group.modules.map((mod) => {
                                                    const Icon = mod.icon;
                                                    const count = getModulePermissionCount(mod.id);
                                                    const isSelected = selectedModule === mod.id;
                                                    const isModComplete = count.granted === count.total;

                                                    return (
                                                        <button
                                                            key={mod.id}
                                                            onClick={() => setSelectedModule(mod.id)}
                                                            className={cn(
                                                                'w-full flex items-center justify-between px-4 py-2.5 pl-10 transition-colors',
                                                                isSelected ? 'bg-blue-50 border-r-2 border-brand-primary' : 'hover:bg-slate-100'
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Icon className={cn('w-4 h-4', mod.color)} />
                                                                <span className={cn('text-sm', isSelected ? 'text-brand-primary font-medium' : 'text-slate-600')}>
                                                                    {mod.name}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {isModComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                                                <span className={cn('text-xs', isModComplete ? 'text-emerald-600' : 'text-slate-400')}>
                                                                    {count.granted}/{count.total}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* 右侧：权限详情 */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        {selectedModuleData ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100')}>
                                        <selectedModuleData.icon className={cn('w-5 h-5', selectedModuleData.color)} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">{selectedModuleData.name}权限</CardTitle>
                                        <CardDescription>
                                            已授权 {getModulePermissionCount(selectedModuleData.id).granted} / {getModulePermissionCount(selectedModuleData.id).total} 项
                                        </CardDescription>
                                    </div>
                                </div>
                                {selectedRole !== UserRole.SUPER_ADMIN && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleModulePermissions(selectedModuleData.id)}
                                    >
                                        {getModulePermissionCount(selectedModuleData.id).granted === getModulePermissionCount(selectedModuleData.id).total
                                            ? '取消全选'
                                            : '全选'}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>请从左侧选择一个模块</p>
                            </div>
                        )}
                    </CardHeader>

                    {selectedModuleData && (
                        <CardContent>
                            {selectedRole === UserRole.SUPER_ADMIN && (
                                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-sm text-amber-700">超级管理员拥有所有权限，无需单独配置</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                {selectedModulePerms.map((perm) => {
                                    const isGranted = hasPermission(perm.id);
                                    return (
                                        <div
                                            key={perm.id}
                                            className={cn(
                                                'flex items-center justify-between p-3 rounded-lg transition-colors',
                                                isGranted ? 'bg-emerald-50' : 'bg-slate-50'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    'w-8 h-8 rounded-lg flex items-center justify-center',
                                                    isGranted ? 'bg-emerald-100' : 'bg-slate-200'
                                                )}>
                                                    {isGranted ? (
                                                        <Check className="w-4 h-4 text-emerald-600" />
                                                    ) : (
                                                        <X className="w-4 h-4 text-slate-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 text-sm">{perm.name}</p>
                                                    <p className="text-xs text-slate-500">{perm.description}</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={isGranted}
                                                onCheckedChange={() => togglePermission(perm.id)}
                                                disabled={selectedRole === UserRole.SUPER_ADMIN || isLoading}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    );
};
