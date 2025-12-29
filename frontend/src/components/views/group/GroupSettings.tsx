import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { groupsApi, Group } from '@/api/groups.api';
import { useAuth } from '@/context/AuthContext';
import { Language } from '@/types';
import { Edit, Check, Calendar, Globe, Building2, Users, Info, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Props {
    language: Language;
    onUpdate?: () => void;
}

// 统计卡片
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    iconBg: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, iconBg }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-slate-500">{title}</p>
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconBg)}>
                {icon}
            </div>
        </div>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
);

// 信息行组件
const InfoRow: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-slate-100 last:border-0">
        <span className="text-sm text-slate-500 sm:w-32 mb-1 sm:mb-0">{label}</span>
        <span className={cn('text-sm font-medium text-slate-900', mono && 'font-mono text-xs')}>{value}</span>
    </div>
);

const GroupSettings: React.FC<Props> = ({ onUpdate }) => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [group, setGroup] = useState<Group | null>(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: '' });
    const [saving, setSaving] = useState(false);

    const groupId = user?.groupId || (user as { company?: { groupId?: string } })?.company?.groupId;
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    useEffect(() => { loadGroup(); }, [groupId]);

    const loadGroup = async () => {
        if (!groupId) { setLoading(false); return; }
        try {
            const data = await groupsApi.getGroup(groupId);
            setGroup(data);
            setEditForm({ name: data.name });
        } catch {
            // 静默处理
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupId) return;
        setSaving(true);
        try {
            const updated = await groupsApi.updateGroup(groupId, { name: editForm.name });
            setGroup(updated);
            setShowEditModal(false);
            onUpdate?.();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : t('updateFailed');
            alert(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
            </div>
        );
    }

    if (!group) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Info className="h-12 w-12 mb-4" />
                <p>无法加载集团信息</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">集团设置</h1>
                    <p className="text-slate-500">管理集团基本信息和配置</p>
                </div>
                {isSuperAdmin && (
                    <Button onClick={() => setShowEditModal(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        编辑信息
                    </Button>
                )}
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="集团名称"
                    value={group.name}
                    icon={<Globe className="w-4 h-4 text-brand-primary" />}
                    iconBg="bg-blue-50"
                />
                <StatCard
                    title="子公司数量"
                    value={group._count?.companies || 0}
                    subtitle="活跃运营中"
                    icon={<Building2 className="w-4 h-4 text-brand-secondary" />}
                    iconBg="bg-sky-50"
                />
                <StatCard
                    title="创建时间"
                    value={new Date(group.createdAt).toLocaleDateString('zh-CN')}
                    icon={<Calendar className="w-4 h-4 text-emerald-600" />}
                    iconBg="bg-emerald-50"
                />
                <StatCard
                    title="运营状态"
                    value={group.isActive ? '正常运营' : '已停用'}
                    icon={<Shield className="w-4 h-4 text-amber-500" />}
                    iconBg="bg-amber-50"
                />
            </div>

            {/* 基本信息卡片 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">基本信息</CardTitle>
                    <CardDescription>集团的详细配置信息</CardDescription>
                </CardHeader>
                <CardContent>
                    <InfoRow label="集团ID" value={group.id} mono />
                    <InfoRow label="集团名称" value={group.name} />
                    <InfoRow
                        label="运营状态"
                        value={
                            <Badge variant={group.isActive ? 'default' : 'secondary'} className={group.isActive ? 'bg-emerald-500' : ''}>
                                {group.isActive ? '正常' : '停用'}
                            </Badge>
                        }
                    />
                    <InfoRow label="创建时间" value={new Date(group.createdAt).toLocaleString('zh-CN')} />
                </CardContent>
            </Card>

            {/* 权限提示 */}
            {!isSuperAdmin && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="flex items-center gap-3 pt-6">
                        <Info className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        <p className="text-sm text-amber-800">仅超级管理员可以修改集团设置</p>
                    </CardContent>
                </Card>
            )}

            {/* 编辑对话框 */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>编辑集团信息</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label>集团名称 <span className="text-red-500">*</span></Label>
                            <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="请输入集团名称"
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                                取消
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? '保存中...' : <><Check className="w-4 h-4 mr-2" />保存</>}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GroupSettings;
