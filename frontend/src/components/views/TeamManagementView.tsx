import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, MoreHorizontal, User as UserIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import { usersApi, User } from '@/api/users.api';
import { UserRole, Language } from '@/types';
import { translations } from '@/utils/i18n';

interface TeamManagementViewProps {
  language: Language;
}

const userSchema = z.object({
  username: z.string().min(2, '用户名至少2个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6个字符').optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum([
    UserRole.SUPER_ADMIN,
    UserRole.GROUP_ADMIN,
    UserRole.MANAGER,
    UserRole.USER
  ]),
});

type UserFormValues = z.infer<typeof userSchema>;

export const TeamManagementView: React.FC<TeamManagementViewProps> = ({ language }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();
  const t = translations[language];

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: UserRole.USER,
    },
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.findAll({ search: searchTerm });
      setUsers(res.data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '获取用户失败',
        description: '无法加载用户列表',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const onSubmit = async (data: UserFormValues) => {
    try {
      if (editingUser) {
        // Update
        // Password is optional for update
        const { password, ...updateData } = data;
        await usersApi.update(editingUser.id, password ? data : updateData);
        toast({ title: '用户已更新' });
      } else {
        // Create
        if (!data.password) {
          form.setError('password', { message: '创建用户必须设置密码' });
          return;
        }
        await usersApi.create(data as any);
        toast({ title: '用户已创建' });
      }
      setIsDialogOpen(false);
      setEditingUser(null);
      form.reset();
      fetchUsers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '操作失败',
        description: error.response?.data?.message || '请重试',
      });
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
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此用户吗？此操作不可恢复。')) return;
    try {
      await usersApi.remove(id);
      toast({ title: '用户已删除' });
      fetchUsers();
    } catch (error) {
      toast({ variant: 'destructive', title: '删除失败' });
    }
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    form.reset({
      role: UserRole.USER,
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t.teamManagement}</h2>
          <p className="text-muted-foreground">{t.manageUsers}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> {t.addUser}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">加载中...</TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">暂无用户</TableCell></TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          {/* <AvatarImage src="/avatars/01.png" alt="@shadcn" /> */}
                          <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div>{user.username}</div>
                          <div className="text-xs text-muted-foreground">{user.firstName} {user.lastName}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        user.role === UserRole.SUPER_ADMIN ? 'border-red-500 text-red-500' :
                          user.role === UserRole.GROUP_ADMIN ? 'border-purple-500 text-purple-500' :
                            user.role === UserRole.MANAGER ? 'border-blue-500 text-blue-500' :
                              'border-gray-500 text-gray-500'
                      }>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? '编辑用户' : '创建新用户'}</DialogTitle>
            <DialogDescription>
              {editingUser ? '修改用户信息及其角色分配' : '添加新的系统用户并分配初始角色'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>用户名</Label>
              <Input {...form.register('username')} disabled={!!editingUser} />
              {form.formState.errors.username && <p className="text-red-500 text-xs">{form.formState.errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input {...form.register('email')} />
              {form.formState.errors.email && <p className="text-red-500 text-xs">{form.formState.errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>名 (First Name)</Label>
                <Input {...form.register('firstName')} />
              </div>
              <div className="space-y-2">
                <Label>姓 (Last Name)</Label>
                <Input {...form.register('lastName')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>角色</Label>
              <Select
                onValueChange={(val) => form.setValue('role', val as UserRole)}
                defaultValue={form.watch('role')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.USER}>User (普通用户)</SelectItem>
                  <SelectItem value={UserRole.MANAGER}>Manager (经理)</SelectItem>
                  <SelectItem value={UserRole.GROUP_ADMIN}>Group Admin (集团管理员)</SelectItem>
                  {/* Super Admin usually cannot be created here easily, but let's allow it for now */}
                  <SelectItem value={UserRole.SUPER_ADMIN}>Super Admin (超级管理员)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>密码 {editingUser && '(留空保持不变)'}</Label>
              <Input type="password" {...form.register('password')} />
              {form.formState.errors.password && <p className="text-red-500 text-xs">{form.formState.errors.password.message}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
