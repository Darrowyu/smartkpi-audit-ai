import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Save, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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

interface Permission {
    id: string;
    name: string;
    description: string;
    module: string;
}

interface RolePermissions {
    [role: string]: string[];
}

export const PermissionsView: React.FC = () => {
    const { t } = useTranslation();

    const modules = useMemo(() => [
        { id: 'kpi-library', name: t('permissions.kpiLibraryModule'), icon: '📊' },
        { id: 'assessment', name: t('permissions.assessmentModule'), icon: '📅' },
        { id: 'data-entry', name: t('permissions.dataEntryModule'), icon: '📝' },
        { id: 'reports', name: t('permissions.reportsModule'), icon: '📈' },
        { id: 'users', name: t('permissions.usersModule'), icon: '👥' },
        { id: 'settings', name: t('permissions.settingsModule'), icon: '⚙️' },
    ], [t]);

    const allPermissions: Permission[] = useMemo(() => [
        { id: 'kpi:view', name: t('permissions.viewKpi'), description: t('permissions.viewKpi'), module: 'kpi-library' },
        { id: 'kpi:create', name: t('permissions.createKpi'), description: t('permissions.createKpi'), module: 'kpi-library' },
        { id: 'kpi:edit', name: t('permissions.editKpi'), description: t('permissions.editKpi'), module: 'kpi-library' },
        { id: 'kpi:delete', name: t('permissions.deleteKpi'), description: t('permissions.deleteKpi'), module: 'kpi-library' },
        { id: 'period:view', name: t('permissions.viewPeriod'), description: t('permissions.viewPeriod'), module: 'assessment' },
        { id: 'period:create', name: t('permissions.createPeriod'), description: t('permissions.createPeriod'), module: 'assessment' },
        { id: 'period:lock', name: t('permissions.lockPeriod'), description: t('permissions.lockPeriod'), module: 'assessment' },
        { id: 'data:view', name: t('permissions.viewEntry'), description: t('permissions.viewEntry'), module: 'data-entry' },
        { id: 'data:submit', name: t('permissions.submitEntry'), description: t('permissions.submitEntry'), module: 'data-entry' },
        { id: 'data:approve', name: t('permissions.approveEntry'), description: t('permissions.approveEntry'), module: 'data-entry' },
        { id: 'report:view', name: t('permissions.viewReport'), description: t('permissions.viewReport'), module: 'reports' },
        { id: 'report:export', name: t('permissions.exportReport'), description: t('permissions.exportReport'), module: 'reports' },
        { id: 'user:view', name: t('permissions.viewUser'), description: t('permissions.viewUser'), module: 'users' },
        { id: 'user:create', name: t('permissions.createUser'), description: t('permissions.createUser'), module: 'users' },
        { id: 'user:edit', name: t('permissions.editUser'), description: t('permissions.editUser'), module: 'users' },
        { id: 'user:delete', name: t('permissions.deleteUser'), description: t('permissions.deleteUser'), module: 'users' },
        { id: 'settings:view', name: t('permissions.viewSettings'), description: t('permissions.viewSettings'), module: 'settings' },
        { id: 'settings:edit', name: t('permissions.editSettings'), description: t('permissions.editSettings'), module: 'settings' },
    ], [t]);

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
            const roles = await permissionsApi.getRolePermissions();
            setRolePermissions(roles);
        } catch (_error) {
            console.error('Failed to load permissions:', _error);
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
            toast({ title: t('permissions.saveSuccess') });
            setHasChanges(false);
        } catch (_error) {
            console.error(_error);
            toast({ variant: 'destructive', title: t('permissions.saveFailed') });
        }
    };

    const handleReset = async () => {
        if (!confirm(t('confirmReset'))) return;
        try {
            await permissionsApi.resetToDefault();
            toast({ title: t('permissions.resetSuccess') });
            await loadData();
            setHasChanges(false);
        } catch (_error) {
            console.error(_error);
            toast({ variant: 'destructive', title: t('permissions.resetFailed') });
        }
    };

    const getPermissionsByModule = (moduleId: string) => {
        return allPermissions.filter(p => p.module === moduleId);
    };

    if (isLoading) {
        return <div>{t('loading')}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('permissions.title')}</h2>
                    <p className="text-muted-foreground">{t('permissions.subtitle')}</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={handleReset} disabled={isLoading}>
                        <RotateCcw className="mr-2 h-4 w-4" /> {t('permissions.reset')}
                    </Button>
                    <Button onClick={handleSave} disabled={!hasChanges || isLoading}>
                        <Save className="mr-2 h-4 w-4" /> {t('permissions.saveChanges')}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">{t('permissions.selectRole')}</CardTitle>
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

                <Card className="md:col-span-3">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>
                                    <Badge variant="outline" className="mr-2">{selectedRole}</Badge>
                                    {t('permissions.title')}
                                </CardTitle>
                                <CardDescription>
                                    {(rolePermissions[selectedRole] || []).length} {t('permissions.permission')}
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
                                                <TableHead>{t('permissions.permission')}</TableHead>
                                                <TableHead>{t('kpiLibrary.description')}</TableHead>
                                                <TableHead className="w-24 text-center">{t('permissions.granted')}</TableHead>
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
