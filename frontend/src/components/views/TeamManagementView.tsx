import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';

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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import { usersApi, User } from '@/api/users.api';
import { UserRole, Language } from '@/types';

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
};

export const TeamManagementView: React.FC<TeamManagementViewProps> = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();

  const userSchema = z.object({
    username: z.string().min(2, t('teamView.usernameMinLength')),
    email: z.string().email(t('teamView.emailInvalid')),
    password: z.string().min(6, t('teamView.passwordMinLength')).optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    role: z.enum([
      UserRole.SUPER_ADMIN,
      UserRole.GROUP_ADMIN,
      UserRole.MANAGER,
      UserRole.USER
    ]),
  });

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
    } catch (_error) {
      toast({
        variant: 'destructive',
        title: t('teamView.getUsersFailed'),
        description: t('teamView.getUsersFailedDesc'),
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
      toast({
        variant: 'destructive',
        title: t('teamView.operationFailed'),
        description: error.response?.data?.message || t('teamView.pleaseRetry'),
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
    if (!confirm(t('teamView.deleteUserConfirm'))) return;
    try {
      await usersApi.remove(id);
      toast({ title: t('teamView.userDeleted') });
      fetchUsers();
    } catch (_error) {
      toast({ variant: 'destructive', title: t('teamView.operationFailed') });
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
          <h2 className="text-3xl font-bold tracking-tight">{t('teamManagement')}</h2>
          <p className="text-muted-foreground">{t('manageUsers')}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> {t('addUser')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('teamView.searchUsers')}
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
                <TableHead>{t('user')}</TableHead>
                <TableHead>{t('role')}</TableHead>
                <TableHead>{t('email')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">{t('loading')}</TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">{t('teamView.noUsers')}</TableCell></TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
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
                        {user.isActive ? t('active') : t('inactive')}
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
                          <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <Pencil className="mr-2 h-4 w-4" /> {t('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(user.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> {t('delete')}
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
            <DialogTitle>{editingUser ? t('teamView.editUserTitle') : t('teamView.createUserTitle')}</DialogTitle>
            <DialogDescription>
              {editingUser ? t('teamView.editUserDesc') : t('teamView.createUserDesc')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('username')}</Label>
              <Input {...form.register('username')} disabled={!!editingUser} />
              {form.formState.errors.username && <p className="text-red-500 text-xs">{form.formState.errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>{t('email')}</Label>
              <Input {...form.register('email')} />
              {form.formState.errors.email && <p className="text-red-500 text-xs">{form.formState.errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('firstName')}</Label>
                <Input {...form.register('firstName')} />
              </div>
              <div className="space-y-2">
                <Label>{t('lastName')}</Label>
                <Input {...form.register('lastName')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('role')}</Label>
              <Select
                onValueChange={(val) => form.setValue('role', val as UserRole)}
                defaultValue={form.watch('role')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.USER}>{t('roleUser')}</SelectItem>
                  <SelectItem value={UserRole.MANAGER}>{t('roleManager')}</SelectItem>
                  <SelectItem value={UserRole.GROUP_ADMIN}>{t('roleGroupAdmin')}</SelectItem>
                  <SelectItem value={UserRole.SUPER_ADMIN}>{t('roleSuperAdmin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('password')} {editingUser && t('teamView.passwordKeepEmpty')}</Label>
              <Input type="password" {...form.register('password')} />
              {form.formState.errors.password && <p className="text-red-500 text-xs">{form.formState.errors.password.message}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('cancel')}</Button>
              <Button type="submit">{t('save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
