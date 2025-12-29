import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, MoreHorizontal, Users, UserCheck, UserX, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { usersApi, User } from '@/api/users.api';
import { apiClient } from '@/api/client';
import { UserRole, Language } from '@/types';
import { cn } from '@/lib/utils';

interface Employee {
    id: string;
    employeeId: string;
    name: string;
    department?: { name: string };
}

interface TeamManagementViewProps {
    language: Language;
}

type UserFormValues = {
    username: string;
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
    linkedEmployeeId?: string;
};

// 统计卡片
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    iconBg: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, iconBg }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <p className="text-sm text-slate-500 mb-1">{title}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
            </div>
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconBg)}>
                {icon}
            </div>
        </div>
    </div>
);

// 角色徽章颜色
const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
        case UserRole.SUPER_ADMIN: return 'bg-red-100 text-red-700 border-red-200';
        case UserRole.GROUP_ADMIN: return 'bg-purple-100 text-purple-700 border-purple-200';
        case UserRole.MANAGER: return 'bg-blue-100 text-blue-700 border-blue-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
};

// 角色中文名
const getRoleName = (role: UserRole) => {
    switch (role) {
        case UserRole.SUPER_ADMIN: return '超级管理员';
        case UserRole.GROUP_ADMIN: return '集团管理员';
        case UserRole.MANAGER: return '部门经理';
        default: return '普通用户';
    }
};

export const TeamManagementView: React.FC<TeamManagementViewProps> = () => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const confirm = useConfirm();
    const [users, setUsers] = useState<User[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const userSchema = z.object({
        username: z.string().min(2, t('teamView.usernameMinLength')),
        email: z.string().email(t('teamView.emailInvalid')),
        password: z.string().min(6, t('teamView.passwordMinLength')).optional().or(z.literal('')),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        role: z.enum([UserRole.SUPER_ADMIN, UserRole.GROUP_ADMIN, UserRole.MANAGER, UserRole.USER]),
        linkedEmployeeId: z.string().optional(),
    });

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: { role: UserRole.USER },
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await usersApi.findAll({ search: searchTerm });
            setUsers(res.data);
        } catch {
            toast({ variant: 'destructive', title: t('teamView.getUsersFailed') });
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await apiClient.get('/employees');
            setEmployees(res.data?.data || []);
        } catch {
            // 静默处理，员工列表加载失败不影响主功能
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchUsers(), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const onSubmit = async (data: UserFormValues) => {
        try {
            if (editingUser) {
                const { password, ...updateData } = data;
                await usersApi.update(editingUser.id, password ? data : updateData);
                toast({ title: t('teamView.userUpdated') });
            } else {
                if (!data.password) {
                    form.setError('password', { message: t('teamView.passwordRequired') });
                    return;
                }
                await usersApi.create(data as any);
                toast({ title: t('teamView.userCreated') });
            }
            setIsDialogOpen(false);
            setEditingUser(null);
            form.reset();
            fetchUsers();
        } catch (error: any) {
            toast({ variant: 'destructive', title: t('teamView.operationFailed'), description: error.response?.data?.message });
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        form.reset({
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            linkedEmployeeId: user.linkedEmployeeId || '',
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: t('common.confirm'),
            description: t('teamView.deleteUserConfirm'),
            variant: 'destructive',
        });
        if (!confirmed) return;
        try {
            await usersApi.remove(id);
            toast({ title: t('teamView.userDeleted') });
            fetchUsers();
        } catch {
            toast({ variant: 'destructive', title: t('teamView.operationFailed') });
        }
    };

    const openCreateDialog = () => {
        setEditingUser(null);
        form.reset({ role: UserRole.USER, username: '', email: '', password: '', firstName: '', lastName: '' });
        setIsDialogOpen(true);
    };

    // 统计数据
    const activeUsers = users.filter(u => u.isActive).length;
    const inactiveUsers = users.filter(u => !u.isActive).length;
    const adminUsers = users.filter(u => u.role === UserRole.SUPER_ADMIN || u.role === UserRole.GROUP_ADMIN).length;

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">用户管理</h1>
                    <p className="text-slate-500">管理系统用户账号和权限</p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" /> 添加用户
                </Button>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="总用户数"
                    value={users.length}
                    subtitle="系统注册用户"
                    icon={<Users className="w-6 h-6 text-brand-primary" />}
                    iconBg="bg-blue-50"
                />
                <StatCard
                    title="活跃用户"
                    value={activeUsers}
                    subtitle="状态正常"
                    icon={<UserCheck className="w-6 h-6 text-emerald-600" />}
                    iconBg="bg-emerald-50"
                />
                <StatCard
                    title="停用用户"
                    value={inactiveUsers}
                    subtitle="已禁用账号"
                    icon={<UserX className="w-6 h-6 text-red-500" />}
                    iconBg="bg-red-50"
                />
                <StatCard
                    title="管理员"
                    value={adminUsers}
                    subtitle="具有管理权限"
                    icon={<Shield className="w-6 h-6 text-purple-600" />}
                    iconBg="bg-purple-50"
                />
            </div>

            {/* 用户列表 */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle className="text-base">用户列表</CardTitle>
                            <CardDescription>共 {users.length} 个用户</CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="搜索用户名或邮箱..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>用户</TableHead>
                                    <TableHead>角色</TableHead>
                                    <TableHead className="hidden sm:table-cell">邮箱</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <>
                                        {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} columns={5} />)}
                                    </>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                                            暂无用户数据
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-sm">
                                                            {user.username.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{user.username}</p>
                                                        <p className="text-xs text-slate-500">{user.firstName} {user.lastName}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getRoleBadgeClass(user.role)}>
                                                    {getRoleName(user.role)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell text-slate-500">
                                                {user.email}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.isActive ? 'default' : 'secondary'} className={user.isActive ? 'bg-emerald-500' : ''}>
                                                    {user.isActive ? '正常' : '停用'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> 编辑
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(user.id)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> 删除
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* 用户表单对话框 */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? '编辑用户' : '添加用户'}</DialogTitle>
                        <DialogDescription>
                            {editingUser ? '修改用户信息' : '创建新的系统用户'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label>用户名 <span className="text-red-500">*</span></Label>
                            <Input {...form.register('username')} disabled={!!editingUser} placeholder="请输入用户名" />
                            {form.formState.errors.username && (
                                <p className="text-red-500 text-xs">{form.formState.errors.username.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>邮箱 <span className="text-red-500">*</span></Label>
                            <Input {...form.register('email')} placeholder="请输入邮箱地址" />
                            {form.formState.errors.email && (
                                <p className="text-red-500 text-xs">{form.formState.errors.email.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>名</Label>
                                <Input {...form.register('firstName')} placeholder="名" />
                            </div>
                            <div className="space-y-2">
                                <Label>姓</Label>
                                <Input {...form.register('lastName')} placeholder="姓" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>角色 <span className="text-red-500">*</span></Label>
                            <Select onValueChange={(val) => form.setValue('role', val as UserRole)} defaultValue={form.watch('role')}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={UserRole.USER}>普通用户</SelectItem>
                                    <SelectItem value={UserRole.MANAGER}>部门经理</SelectItem>
                                    <SelectItem value={UserRole.GROUP_ADMIN}>集团管理员</SelectItem>
                                    <SelectItem value={UserRole.SUPER_ADMIN}>超级管理员</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>关联员工 <span className="text-slate-400 text-xs">(可选)</span></Label>
                            <Select
                                onValueChange={(val) => form.setValue('linkedEmployeeId', val === '_none_' ? '' : val)}
                                value={form.watch('linkedEmployeeId') || '_none_'}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="选择员工" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none_">不关联员工</SelectItem>
                                    {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>
                                            {emp.name} ({emp.employeeId}){emp.department?.name && ` - ${emp.department.name}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-400">关联员工后，用户可以查看和管理该员工的绩效数据</p>
                        </div>

                        <div className="space-y-2">
                            <Label>密码 {editingUser && <span className="text-slate-400 text-xs">(留空保持不变)</span>}</Label>
                            <Input type="password" {...form.register('password')} placeholder={editingUser ? '••••••' : '请输入密码'} />
                            {form.formState.errors.password && (
                                <p className="text-red-500 text-xs">{form.formState.errors.password.message}</p>
                            )}
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                            <Button type="submit">保存</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
