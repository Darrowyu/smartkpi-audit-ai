import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { companiesApi, Company, CompanyStats } from '@/api/companies.api';
import { useAuth } from '@/context/AuthContext';
import { Language } from '@/types';
import { Building2, Users, Briefcase, UserCircle, FileText, BarChart3, Edit, Check, Info, Shield, Globe, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface Props {
    language: Language;
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

// 数据项卡片
interface DataCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
}

const DataCard: React.FC<DataCardProps> = ({ title, value, icon, color }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl text-center">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-2', color)}>
            {icon}
        </div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{title}</p>
    </div>
);

// 信息行
const InfoRow: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-slate-100 last:border-0">
        <span className="text-sm text-slate-500 sm:w-32 mb-1 sm:mb-0">{label}</span>
        <span className={cn('text-sm font-medium text-slate-900', mono && 'font-mono text-xs')}>{value}</span>
    </div>
);

const CompanySettings: React.FC<Props> = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { toast } = useToast();
    const [company, setCompany] = useState<Company | null>(null);
    const [stats, setStats] = useState<CompanyStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', code: '', domain: '' });
    const [saving, setSaving] = useState(false);

    const isAdmin = user?.role === 'GROUP_ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [companyData, statsData] = await Promise.all([
                companiesApi.getCompany(),
                companiesApi.getStats(),
            ]);
            setCompany(companyData);
            setStats(statsData);
            setEditForm({
                name: companyData.name,
                code: companyData.code || '',
                domain: companyData.domain || ''
            });
        } catch {
            toast({ variant: 'destructive', title: '加载公司信息失败' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editForm.name.trim()) {
            toast({ variant: 'destructive', title: '公司名称不能为空' });
            return;
        }
        setSaving(true);
        try {
            const updated = await companiesApi.updateCompany({
                name: editForm.name.trim(),
                code: editForm.code.trim() || undefined,
                domain: editForm.domain.trim() || undefined,
            });
            setCompany(updated);
            setShowEditModal(false);
            toast({ title: '保存成功' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: e.response?.data?.message || '保存失败' });
        } finally {
            setSaving(false);
        }
    };

    const handleRefresh = () => {
        loadData();
        toast({ title: '已刷新' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
            </div>
        );
    }

    if (!company) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Info className="h-12 w-12 mb-4" />
                <p>无法加载公司信息</p>
                <Button variant="outline" onClick={loadData} className="mt-4">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重试
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">公司设置</h1>
                    <p className="text-slate-500">管理公司基本信息</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
                        <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                    </Button>
                    {isAdmin && (
                        <Button onClick={() => setShowEditModal(true)}>
                            <Edit className="w-4 h-4 mr-2" />
                            编辑信息
                        </Button>
                    )}
                </div>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="公司名称"
                    value={company.name}
                    subtitle={`创建于 ${new Date(company.createdAt).toLocaleDateString('zh-CN')}`}
                    icon={<Building2 className="w-4 h-4 text-brand-primary" />}
                    iconBg="bg-primary/10"
                />
                <StatCard
                    title="公司代码"
                    value={company.code || '-'}
                    subtitle="系统识别码"
                    icon={<Globe className="w-4 h-4 text-brand-secondary" />}
                    iconBg="bg-sky-50"
                />
                <StatCard
                    title="域名标识"
                    value={company.domain || '-'}
                    subtitle="访问地址"
                    icon={<Globe className="w-4 h-4 text-violet-500" />}
                    iconBg="bg-violet-50"
                />
                <StatCard
                    title="运营状态"
                    value={company.isActive ? '正常运营' : '已停用'}
                    icon={<Shield className="w-4 h-4 text-amber-500" />}
                    iconBg="bg-amber-50"
                />
            </div>

            {/* 数据统计 */}
            {stats && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">数据统计</CardTitle>
                        <CardDescription>公司各项业务数据概览</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            <DataCard
                                title="用户数"
                                value={stats.users}
                                icon={<Users className="w-5 h-5 text-white" />}
                                color="bg-brand-primary"
                            />
                            <DataCard
                                title="部门数"
                                value={stats.departments}
                                icon={<Briefcase className="w-5 h-5 text-white" />}
                                color="bg-brand-secondary"
                            />
                            <DataCard
                                title="员工数"
                                value={stats.employees}
                                icon={<UserCircle className="w-5 h-5 text-white" />}
                                color="bg-emerald-500"
                            />
                            <DataCard
                                title="文件数"
                                value={stats.files}
                                icon={<FileText className="w-5 h-5 text-white" />}
                                color="bg-amber-500"
                            />
                            <DataCard
                                title="分析报告"
                                value={stats.analyses}
                                icon={<BarChart3 className="w-5 h-5 text-white" />}
                                color="bg-purple-500"
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 基本信息 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">基本信息</CardTitle>
                    <CardDescription>公司的详细配置信息</CardDescription>
                </CardHeader>
                <CardContent>
                    <InfoRow label="公司ID" value={<code className="px-2 py-1 bg-slate-100 rounded text-xs">{company.id}</code>} />
                    <InfoRow label="公司名称" value={company.name} />
                    <InfoRow label="公司代码" value={company.code || '-'} />
                    <InfoRow label="域名标识" value={company.domain || '-'} />
                    <InfoRow
                        label="运营状态"
                        value={
                            <Badge variant={company.isActive ? 'default' : 'secondary'} className={company.isActive ? 'bg-emerald-500' : ''}>
                                {company.isActive ? '正常' : '停用'}
                            </Badge>
                        }
                    />
                    <InfoRow label="创建时间" value={new Date(company.createdAt).toLocaleString('zh-CN')} />
                </CardContent>
            </Card>

            {/* 权限提示 */}
            {!isAdmin && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="flex items-center gap-3 pt-6">
                        <Info className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        <p className="text-sm text-amber-800">仅管理员可以修改公司设置</p>
                    </CardContent>
                </Card>
            )}

            {/* 编辑对话框 */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>编辑公司信息</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label>公司名称 <span className="text-red-500">*</span></Label>
                            <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="请输入公司名称"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>公司代码</Label>
                            <Input
                                value={editForm.code}
                                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                                placeholder="如：DG001"
                                className="font-mono"
                            />
                            <p className="text-xs text-slate-500">用于系统内部识别，建议使用简短的字母数字组合</p>
                        </div>
                        <div className="space-y-2">
                            <Label>域名标识</Label>
                            <Input
                                value={editForm.domain}
                                onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                                placeholder="如：dongguan.makrite.com"
                            />
                            <p className="text-xs text-slate-500">用于生成公司专属访问地址</p>
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

export default CompanySettings;
