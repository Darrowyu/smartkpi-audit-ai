import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Plus, Lock, Unlock, Calendar, Clock, CheckCircle2, AlertCircle,
    Play, Pause, BarChart3, Users, Target, ArrowRight, MoreHorizontal,
    CalendarDays, TrendingUp, FileText, Archive
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import { assessmentApi } from '@/api/assessment.api';
import { AssessmentPeriod, PeriodStatus } from '@/types';

type PeriodFormValues = {
    name: string;
    startDate: string;
    endDate: string;
};

// 状态配置映射
const STATUS_CONFIG: Record<PeriodStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
    [PeriodStatus.DRAFT]: {
        label: '草稿',
        color: 'text-slate-600',
        bgColor: 'bg-slate-100',
        icon: FileText,
    },
    [PeriodStatus.ACTIVE]: {
        label: '进行中',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
        icon: Play,
    },
    [PeriodStatus.LOCKED]: {
        label: '已锁定',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        icon: Lock,
    },
    [PeriodStatus.ARCHIVED]: {
        label: '已归档',
        color: 'text-slate-500',
        bgColor: 'bg-slate-100',
        icon: Archive,
    },
};

// 计算周期进度
const calculateProgress = (startDate: string, endDate: string): number => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();
    if (now <= start) return 0;
    if (now >= end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
};

// 计算剩余天数
const calculateDaysRemaining = (endDate: string): number => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const remaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return remaining > 0 ? remaining : 0;
};

// 格式化日期
const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
};

// 统计卡片组件
interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    iconBg: string;
    suffix?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconBg, suffix }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <p className="text-sm text-slate-500 mb-1">{title}</p>
                <p className="text-3xl font-bold text-slate-900">
                    {value}
                    {suffix && <span className="text-lg text-slate-400 ml-1">{suffix}</span>}
                </p>
            </div>
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconBg)}>
                {icon}
            </div>
        </div>
    </div>
);

// 周期卡片组件
interface PeriodCardProps {
    period: AssessmentPeriod;
    onLock: (id: string) => void;
    onActivate: (id: string) => void;
}

const PeriodCard: React.FC<PeriodCardProps> = ({ period, onLock, onActivate }) => {
    const statusConfig = STATUS_CONFIG[period.status] || STATUS_CONFIG[PeriodStatus.DRAFT];
    const StatusIcon = statusConfig.icon;
    const progress = calculateProgress(period.startDate, period.endDate);
    const daysRemaining = calculateDaysRemaining(period.endDate);
    const isActive = period.status === PeriodStatus.ACTIVE;
    const isDraft = period.status === PeriodStatus.DRAFT;

    return (
        <div className={cn(
            'bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-all',
            isActive ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-200'
        )}>
            {/* 头部：状态 + 操作 */}
            <div className="flex items-center justify-between mb-4">
                <Badge className={cn('px-2.5 py-1', statusConfig.bgColor, statusConfig.color)}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                </Badge>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {isDraft && (
                            <>
                                <DropdownMenuItem onClick={() => onActivate(period.id)}>
                                    <Play className="h-4 w-4 mr-2" /> 激活周期
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onLock(period.id)}>
                                    <Lock className="h-4 w-4 mr-2" /> 锁定周期
                                </DropdownMenuItem>
                            </>
                        )}
                        {isActive && (
                            <DropdownMenuItem onClick={() => onLock(period.id)}>
                                <Lock className="h-4 w-4 mr-2" /> 锁定周期
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* 周期名称 */}
            <h3 className="text-lg font-semibold text-slate-900 mb-3">{period.name}</h3>

            {/* 日期范围 */}
            <div className="flex items-center text-sm text-slate-500 mb-4">
                <CalendarDays className="w-4 h-4 mr-2 text-slate-400" />
                <span>{formatDate(period.startDate)}</span>
                <ArrowRight className="w-4 h-4 mx-2 text-slate-300" />
                <span>{formatDate(period.endDate)}</span>
            </div>

            {/* 进度条 */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">周期进度</span>
                    <span className={cn(
                        'text-sm font-semibold',
                        progress >= 80 ? 'text-amber-500' : 'text-slate-600'
                    )}>
                        {progress}%
                    </span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {/* 底部信息 */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-1 text-slate-400" />
                    <span className="text-slate-500">
                        {daysRemaining > 0 ? `剩余 ${daysRemaining} 天` : '已结束'}
                    </span>
                </div>
                {isActive && (
                    <div className="flex items-center text-sm text-emerald-600">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                        进行中
                    </div>
                )}
            </div>
        </div>
    );
};

export const AssessmentPeriodView: React.FC = () => {
    const { t } = useTranslation();
    const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    const periodSchema = z.object({
        name: z.string().min(1, t('assessmentView.enterPeriodName')),
        startDate: z.string().min(1, t('assessmentView.selectStartDate')),
        endDate: z.string().min(1, t('assessmentView.selectEndDate')),
    });

    const form = useForm<PeriodFormValues>({
        resolver: zodResolver(periodSchema),
    });

    const fetchPeriods = async () => {
        setLoading(true);
        try {
            const response = await assessmentApi.getPeriods();
            setPeriods(response.data || []);
        } catch (_error) {
            toast({ variant: 'destructive', title: t('assessmentView.loadFailed'), description: t('assessmentView.loadFailedDesc') });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPeriods();
    }, []);

    // 统计数据
    const stats = useMemo(() => {
        const total = periods.length;
        const active = periods.filter(p => p.status === PeriodStatus.ACTIVE).length;
        const draft = periods.filter(p => p.status === PeriodStatus.DRAFT).length;
        const locked = periods.filter(p => p.status === PeriodStatus.LOCKED).length;
        return { total, active, draft, locked };
    }, [periods]);

    const onSubmit = async (data: PeriodFormValues) => {
        try {
            await assessmentApi.createPeriod(data);
            toast({ title: t('assessmentView.createSuccess') });
            setIsDialogOpen(false);
            form.reset();
            fetchPeriods();
        } catch (_error) {
            toast({ variant: 'destructive', title: t('assessmentView.createFailed') });
        }
    };

    const handleLock = async (id: string) => {
        if (!confirm(t('assessmentView.lockConfirm'))) return;
        try {
            await assessmentApi.lockPeriod(id);
            toast({ title: t('assessmentView.locked') });
            fetchPeriods();
        } catch (_error) {
            toast({ variant: 'destructive', title: t('assessmentView.lockFailed') });
        }
    };

    const handleActivate = async (id: string) => {
        try {
            await assessmentApi.activatePeriod(id);
            toast({ title: '周期已激活' });
            fetchPeriods();
        } catch (_error) {
            toast({ variant: 'destructive', title: '激活失败' });
        }
    };

    // 排序：进行中 > 草稿 > 已锁定 > 已归档
    const sortedPeriods = useMemo(() => {
        const statusOrder: Record<PeriodStatus, number> = { 
            [PeriodStatus.ACTIVE]: 0, 
            [PeriodStatus.DRAFT]: 1, 
            [PeriodStatus.LOCKED]: 2,
            [PeriodStatus.ARCHIVED]: 3,
        };
        return [...periods].sort((a, b) => {
            const orderA = statusOrder[a.status] ?? 4;
            const orderB = statusOrder[b.status] ?? 4;
            if (orderA !== orderB) return orderA - orderB;
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        });
    }, [periods]);

    return (
        <div className="space-y-6">
            {/* 头部 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">考核周期管理</h1>
                    <p className="text-sm sm:text-base text-slate-500">创建和管理绩效考核周期</p>
                </div>
                <Button onClick={() => { form.reset(); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> 新建周期
                </Button>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="周期总数"
                    value={stats.total}
                    icon={<Calendar className="w-6 h-6 text-[#1E4B8E]" />}
                    iconBg="bg-blue-50"
                />
                <StatCard
                    title="进行中"
                    value={stats.active}
                    icon={<Play className="w-6 h-6 text-emerald-600" />}
                    iconBg="bg-emerald-50"
                />
                <StatCard
                    title="草稿"
                    value={stats.draft}
                    icon={<FileText className="w-6 h-6 text-slate-500" />}
                    iconBg="bg-slate-100"
                />
                <StatCard
                    title="已锁定"
                    value={stats.locked}
                    icon={<Lock className="w-6 h-6 text-amber-500" />}
                    iconBg="bg-amber-50"
                />
            </div>

            {/* 周期卡片网格 */}
            {loading ? (
                <div className="text-center py-20 text-slate-500">加载中...</div>
            ) : sortedPeriods.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 mb-4">暂无考核周期</p>
                    <Button onClick={() => { form.reset(); setIsDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> 创建第一个周期
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedPeriods.map((period) => (
                        <PeriodCard
                            key={period.id}
                            period={period}
                            onLock={handleLock}
                            onActivate={handleActivate}
                        />
                    ))}
                </div>
            )}

            {/* 新建周期对话框 */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>新建考核周期</DialogTitle>
                        <DialogDescription>创建一个新的绩效考核周期</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label>周期名称 <span className="text-red-500">*</span></Label>
                            <Input {...form.register('name')} placeholder="如：2025年第一季度" />
                            {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>开始日期 <span className="text-red-500">*</span></Label>
                                <Input type="date" {...form.register('startDate')} />
                                {form.formState.errors.startDate && <p className="text-red-500 text-xs">{form.formState.errors.startDate.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>结束日期 <span className="text-red-500">*</span></Label>
                                <Input type="date" {...form.register('endDate')} />
                                {form.formState.errors.endDate && <p className="text-red-500 text-xs">{form.formState.errors.endDate.message}</p>}
                            </div>
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">取消</Button>
                            <Button type="submit" className="w-full sm:w-auto">创建周期</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
