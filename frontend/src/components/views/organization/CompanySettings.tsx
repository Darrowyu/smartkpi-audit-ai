import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { companiesApi, Company, CompanyStats } from '@/api/companies.api';
import { useAuth } from '@/context/AuthContext';
import { Language } from '@/types';
import { Building2, Users, Briefcase, UserCircle, FileText, BarChart3, Edit, Check, Calendar, Info, Shield, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    const [company, setCompany] = useState<Company | null>(null);
    const [stats, setStats] = useState<CompanyStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', code: '', domain: '' });
    const [saving, setSaving] = useState(false);

    const isAdmin = user?.role === 'GROUP_ADMIN' || user?.role === 'SUPER_ADMIN';

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [companyData, statsData] = await Promise.all([
                companiesApi.getCompany(),
                companiesApi.getStats(),
            ]);
            setCompany(companyData);
            setStats(statsData);
            setEditForm({
                name: companyData.name,
                code: (companyData as any).code || '',
                domain: (companyData as any).domain || ''
            });
        } catch {
            // 静默处理
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await companiesApi.updateCompany({
                name: editForm.name,
                code: editForm.code || undefined,
                domain: editForm.domain || undefined,
            });
            setCompany(updated);
            setShowEditModal(false);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : t('updateFailed');
            alert(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E4B8E]" />
            </div>
        );
    }

    if (!company) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Info className="h-12 w-12 mb-4" />
                <p>无法加载公司信息</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">公司设置</h1>
                    <p className="text-slate-500">管理公司基本信息和查看统计数据</p>
                </div>
                {isAdmin && (
                    <Button onClick={() => setShowEditModal(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        编辑信息
                    </Button>
                )}
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="公司名称"
                    value={company.name}
                    icon={<Building2 className="w-4 h-4 text-[#1E4B8E]" />}
                    iconBg="bg-blue-50"
                />
                <StatCard
                    title="公司代码"
                    value={(company as any).code || '-'}
                    icon={<Globe className="w-4 h-4 text-[#5B9BD5]" />}
                    iconBg="bg-sky-50"
                />
                <StatCard
                    title="创建时间"
                    value={new Date(company.createdAt).toLocaleDateString('zh-CN')}
                    icon={<Calendar className="w-4 h-4 text-emerald-600" />}
                    iconBg="bg-emerald-50"
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
                                color="bg-[#1E4B8E]"
                            />
                            <DataCard
                                title="部门数"
                                value={stats.departments}
                                icon={<Briefcase className="w-5 h-5 text-white" />}
                                color="bg-[#5B9BD5]"
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
                    <InfoRow label="公司ID" value={company.id} mono />
                    <InfoRow label="公司名称" value={company.name} />
                    <InfoRow label="公司代码" value={(company as any).code || '-'} />
                    <InfoRow label="域名标识" value={(company as any).domain || '-'} />
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
                            />
                            <p className="text-xs text-slate-500">用于系统内部识别，建议使用简短的字母数字组合</p>
                        </div>
                        <div className="space-y-2">
                            <Label>域名标识</Label>
                            <Input
                                value={editForm.domain}
                                onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                                placeholder="如：dongguan"
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
