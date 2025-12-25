import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Plus, Search, Pencil, Trash2, Upload, Download, Filter,
    BarChart3, Target, TrendingUp, CheckCircle2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import { kpiLibraryApi } from '@/api/kpi-library.api';
import { KPIDefinition, FormulaType, AssessmentFrequency } from '@/types';

// 分类映射
const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
    FIN: { label: '财务指标', color: 'bg-blue-100 text-blue-700' },
    CUS: { label: '客户指标', color: 'bg-purple-100 text-purple-700' },
    OPS: { label: '运营指标', color: 'bg-green-100 text-green-700' },
    MKT: { label: '市场指标', color: 'bg-orange-100 text-orange-700' },
    HR: { label: '人力资源', color: 'bg-pink-100 text-pink-700' },
    RND: { label: '创新指标', color: 'bg-cyan-100 text-cyan-700' },
};

// 频率映射
const FREQUENCY_MAP: Record<AssessmentFrequency, string> = {
    [AssessmentFrequency.MONTHLY]: '月',
    [AssessmentFrequency.QUARTERLY]: '季度',
    [AssessmentFrequency.YEARLY]: '年',
};

// 从code获取分类
const getCategoryFromCode = (code: string): string => {
    const prefix = code.split('-')[0] || code.substring(0, 3);
    return prefix.toUpperCase();
};

// 扩展KPI类型（含展示数据）
interface KPIDisplayData extends KPIDefinition {
    progress?: number;
    currentValue?: number;
    targetValue?: number;
    trend?: 'up' | 'down';
    trendPercent?: number;
}

interface KPIFormValues {
    code: string;
    name: string;
    description?: string;
    formulaType: FormulaType;
    customFormula?: string;
    frequency: AssessmentFrequency;
    defaultWeight: number;
    scoreCap: number;
    scoreFloor: number;
    unit?: string;
}

// 统计卡片组件
interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    iconBg: string;
    trend?: number;
    trendLabel?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconBg, trend, trendLabel }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <p className="text-sm text-slate-500 mb-1">{title}</p>
                <p className="text-3xl font-bold text-slate-900">{value}</p>
                {trend !== undefined && (
                    <p className={cn('text-sm font-medium mt-1', trend >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                        {trendLabel && <span className="text-slate-400 font-normal ml-1">{trendLabel}</span>}
                    </p>
                )}
            </div>
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconBg)}>
                {icon}
            </div>
        </div>
    </div>
);

// KPI卡片组件
interface KPICardProps {
    kpi: KPIDisplayData;
    onEdit: (kpi: KPIDefinition) => void;
    onDelete: (id: string) => void;
}

const KPICard: React.FC<KPICardProps> = ({ kpi, onEdit, onDelete }) => {
    const category = getCategoryFromCode(kpi.code);
    const categoryInfo = CATEGORY_MAP[category] || { label: '其他', color: 'bg-slate-100 text-slate-700' };
    const defaultWeight = kpi.defaultWeight || 0;
    const progress = kpi.progress ?? defaultWeight;
    const currentValue = kpi.currentValue ?? '-';
    const targetValue = kpi.targetValue ?? 100;
    const trend = kpi.trend ?? (kpi.isActive ? 'up' : 'down');

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            {/* 头部：状态 + 编码 */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Badge variant={kpi.isActive ? 'default' : 'secondary'} className={kpi.isActive ? 'bg-emerald-500' : ''}>
                        {kpi.isActive ? '启用' : '停用'}
                    </Badge>
                    <span className="text-sm text-slate-500 font-medium">{kpi.code}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(kpi)}>
                        <Pencil className="h-4 w-4 text-slate-400" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(kpi.id)}>
                        <Trash2 className="h-4 w-4 text-slate-400" />
                    </Button>
                </div>
            </div>

            {/* 名称 */}
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{kpi.name}</h3>

            {/* 描述 */}
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{kpi.description || '暂无描述'}</p>

            {/* 分类 + 单位 */}
            <div className="flex items-center gap-4 mb-3 text-sm">
                <div>
                    <span className="text-slate-400">分类：</span>
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', categoryInfo.color)}>
                        {categoryInfo.label}
                    </span>
                </div>
                <div>
                    <span className="text-slate-400">单位：</span>
                    <span className="text-slate-700">{kpi.unit || '%'}</span>
                </div>
            </div>

            {/* 频率 + 趋势 */}
            <div className="flex items-center gap-4 mb-4 text-sm">
                <div>
                    <span className="text-slate-400">频率：</span>
                    <span className="text-slate-700">{FREQUENCY_MAP[kpi.frequency]}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-slate-400">趋势：</span>
                    {trend === 'up' ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                </div>
            </div>

            {/* 完成进度 */}
            <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-500">完成进度</span>
                    <span className={cn('text-sm font-semibold', progress >= 80 ? 'text-emerald-600' : progress >= 60 ? 'text-amber-500' : 'text-red-500')}>
                        {progress.toFixed(1)}%
                    </span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {/* 当前值 / 目标值 */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">当前：{currentValue}{kpi.unit || '%'}</span>
                <span className="text-slate-400">目标：{targetValue}{kpi.unit || '%'}</span>
            </div>
        </div>
    );
};

export const KPILibraryView: React.FC = () => {
    const { t } = useTranslation();
    const [kpis, setKpis] = useState<KPIDisplayData[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingKPI, setEditingKPI] = useState<KPIDefinition | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedFrequency, setSelectedFrequency] = useState<string>('all');

    const { toast } = useToast();

    const kpiSchema = z.object({
        code: z.string().min(1, t('kpiLibrary.enterKpiCode')),
        name: z.string().min(1, t('kpiLibrary.enterKpiName')),
        description: z.string().optional(),
        formulaType: z.enum([
            FormulaType.POSITIVE,
            FormulaType.NEGATIVE,
            FormulaType.BINARY,
            FormulaType.STEPPED,
            FormulaType.CUSTOM,
        ]),
        customFormula: z.string().optional(),
        frequency: z.enum([
            AssessmentFrequency.MONTHLY,
            AssessmentFrequency.QUARTERLY,
            AssessmentFrequency.YEARLY,
        ]),
        defaultWeight: z.number().min(0).max(100),
        scoreCap: z.number().min(0),
        scoreFloor: z.number().min(0),
        unit: z.string().optional(),
    });

    const form = useForm<KPIFormValues>({
        resolver: zodResolver(kpiSchema),
        defaultValues: {
            formulaType: FormulaType.POSITIVE,
            frequency: AssessmentFrequency.MONTHLY,
            defaultWeight: 10,
            scoreCap: 120,
            scoreFloor: 0,
        },
    });

    const fetchKPIs = async () => {
        setLoading(true);
        try {
            const res = await kpiLibraryApi.findAll({ search: searchTerm });
            setKpis(res.data);
        } catch (_error) {
            toast({ variant: 'destructive', title: t('common.loadFailed') });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKPIs();
    }, [searchTerm]);

    // 过滤后的KPI列表
    const filteredKpis = useMemo(() => {
        return kpis.filter(kpi => {
            if (selectedCategory !== 'all' && getCategoryFromCode(kpi.code) !== selectedCategory) return false;
            if (selectedStatus === 'active' && !kpi.isActive) return false;
            if (selectedStatus === 'inactive' && kpi.isActive) return false;
            if (selectedFrequency !== 'all' && kpi.frequency !== selectedFrequency) return false;
            return true;
        });
    }, [kpis, selectedCategory, selectedStatus, selectedFrequency]);

    // 统计数据
    const stats = useMemo(() => {
        const total = kpis.length;
        const active = kpis.filter(k => k.isActive).length;
        const achieved = Math.floor(total * 0.67); // 模拟达成数
        const trending = Math.floor(total * 0.56); // 模拟上升趋势数
        return { total, active, achieved, trending };
    }, [kpis]);

    // 分类统计
    const categoryStats = useMemo(() => {
        const counts: Record<string, number> = { all: kpis.length };
        kpis.forEach(kpi => {
            const cat = getCategoryFromCode(kpi.code);
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }, [kpis]);

    const onSubmit = async (data: KPIFormValues) => {
        try {
            if (editingKPI) {
                await kpiLibraryApi.update(editingKPI.id, data);
                toast({ title: t('kpiLibrary.updateSuccess') });
            } else {
                await kpiLibraryApi.create(data);
                toast({ title: t('kpiLibrary.createSuccess') });
            }
            setIsDialogOpen(false);
            setEditingKPI(null);
            form.reset();
            fetchKPIs();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: t('kpiLibrary.operationFailed'),
                description: error.response?.data?.message,
            });
        }
    };

    const handleEdit = (kpi: KPIDefinition) => {
        setEditingKPI(kpi);
        form.reset({
            code: kpi.code,
            name: kpi.name,
            description: kpi.description,
            formulaType: kpi.formulaType,
            customFormula: kpi.customFormula,
            frequency: kpi.frequency,
            defaultWeight: kpi.defaultWeight,
            scoreCap: kpi.scoreCap,
            scoreFloor: kpi.scoreFloor,
            unit: kpi.unit,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('kpiLibrary.deleteConfirm'))) return;
        try {
            await kpiLibraryApi.remove(id);
            toast({ title: t('kpiLibrary.deleteSuccess') });
            fetchKPIs();
        } catch (_error) {
            toast({ variant: 'destructive', title: t('kpiLibrary.operationFailed') });
        }
    };

    const handleImport = () => {
        toast({ title: '导入功能开发中' });
    };

    const handleExport = () => {
        toast({ title: '导出功能开发中' });
    };

    return (
        <div className="space-y-6">
            {/* 头部 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">KPI指标库</h1>
                    <p className="text-sm sm:text-base text-slate-500">管理和维护企业关键绩效指标</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleImport}>
                        <Upload className="mr-2 h-4 w-4" /> 导入
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> 导出
                    </Button>
                    <Button onClick={() => { setEditingKPI(null); form.reset(); setIsDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> 新建指标
                    </Button>
                </div>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="指标总数"
                    value={stats.total}
                    icon={<BarChart3 className="w-6 h-6 text-[#1E4B8E]" />}
                    iconBg="bg-blue-50"
                />
                <StatCard
                    title="已开指标"
                    value={stats.active}
                    icon={<Target className="w-6 h-6 text-[#5B9BD5]" />}
                    iconBg="bg-sky-50"
                    trend={12}
                />
                <StatCard
                    title="达成目标"
                    value={stats.achieved}
                    icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                    iconBg="bg-emerald-50"
                    trend={5}
                />
                <StatCard
                    title="上升趋势"
                    value={stats.trending}
                    icon={<TrendingUp className="w-6 h-6 text-amber-500" />}
                    iconBg="bg-amber-50"
                />
            </div>

            {/* 分类标签 */}
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                    className={selectedCategory === 'all' ? 'bg-[#1E4B8E]' : ''}
                >
                    全部 {categoryStats.all || 0}
                </Button>
                {Object.entries(CATEGORY_MAP).map(([key, { label }]) => (
                    <Button
                        key={key}
                        variant={selectedCategory === key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(key)}
                        className={selectedCategory === key ? 'bg-[#1E4B8E]' : ''}
                    >
                        {label} {categoryStats[key] || 0}
                    </Button>
                ))}
            </div>

            {/* 搜索和筛选 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="搜索指标名称、编码..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full sm:w-32">
                        <SelectValue placeholder="全部状态" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="active">启用</SelectItem>
                        <SelectItem value="inactive">停用</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={selectedFrequency} onValueChange={setSelectedFrequency}>
                    <SelectTrigger className="w-full sm:w-32">
                        <SelectValue placeholder="全部频率" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部频率</SelectItem>
                        <SelectItem value={AssessmentFrequency.MONTHLY}>月度</SelectItem>
                        <SelectItem value={AssessmentFrequency.QUARTERLY}>季度</SelectItem>
                        <SelectItem value={AssessmentFrequency.YEARLY}>年度</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            {/* KPI卡片网格 */}
            {loading ? (
                <div className="text-center py-20 text-slate-500">加载中...</div>
            ) : filteredKpis.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>暂无指标数据</p>
                    <Button className="mt-4" onClick={() => { setEditingKPI(null); form.reset(); setIsDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> 创建第一个指标
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredKpis.map((kpi) => (
                        <KPICard key={kpi.id} kpi={kpi} onEdit={handleEdit} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            {/* 新建/编辑对话框 */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingKPI ? '编辑指标' : '新建指标'}</DialogTitle>
                        <DialogDescription>填写指标基本信息和计算规则</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>指标编码 <span className="text-red-500">*</span></Label>
                                <Input {...form.register('code')} placeholder="如：FIN-001" disabled={!!editingKPI} />
                                {form.formState.errors.code && <p className="text-red-500 text-xs">{form.formState.errors.code.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>指标名称 <span className="text-red-500">*</span></Label>
                                <Input {...form.register('name')} placeholder="如：销售收入增长率" />
                                {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>指标描述</Label>
                            <Input {...form.register('description')} placeholder="描述该指标的定义和计算方式" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>计算公式</Label>
                                <Select
                                    onValueChange={(val) => form.setValue('formulaType', val as FormulaType)}
                                    defaultValue={form.watch('formulaType')}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={FormulaType.POSITIVE}>越高越好</SelectItem>
                                        <SelectItem value={FormulaType.NEGATIVE}>越低越好</SelectItem>
                                        <SelectItem value={FormulaType.BINARY}>是否达成</SelectItem>
                                        <SelectItem value={FormulaType.CUSTOM}>自定义公式</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>考核频率</Label>
                                <Select
                                    onValueChange={(val) => form.setValue('frequency', val as AssessmentFrequency)}
                                    defaultValue={form.watch('frequency')}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={AssessmentFrequency.MONTHLY}>月度</SelectItem>
                                        <SelectItem value={AssessmentFrequency.QUARTERLY}>季度</SelectItem>
                                        <SelectItem value={AssessmentFrequency.YEARLY}>年度</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label>默认权重 (%)</Label>
                                <Input type="number" {...form.register('defaultWeight', { valueAsNumber: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label>得分上限</Label>
                                <Input type="number" {...form.register('scoreCap', { valueAsNumber: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label>得分下限</Label>
                                <Input type="number" {...form.register('scoreFloor', { valueAsNumber: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label>单位</Label>
                                <Input {...form.register('unit')} placeholder="如：%、元" />
                            </div>
                        </div>

                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                            <Button type="submit">{editingKPI ? '保存修改' : '创建指标'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
