import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Download, Upload, Plus, Save, Send, FileSpreadsheet, Users, Target,
    CheckCircle2, Clock, AlertCircle, Trash2, ChevronDown, ChevronUp,
    FileUp, X, RefreshCw
} from 'lucide-react';
import { assessmentApi } from '@/api/assessment.api';
import { assignmentApi, KPIAssignmentDto } from '@/api/assignment.api';
import { AssessmentPeriod, PeriodStatus, AssessmentFrequency } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { CardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { apiClient } from '@/api/client';

// 类型定义
interface Employee {
    id: string;
    employeeId: string;
    name: string;
    department?: { name: string };
}

interface ManualEntry {
    id: string;
    employeeId: string;
    employeeName: string;
    departmentName: string;
    assignmentId: string;
    kpiCode: string;
    kpiName: string;
    targetValue: number;
    unit: string;
    actualValue: string;
    remark: string;
}

interface DraftData {
    periodId: string;
    entries: ManualEntry[];
    savedAt: string;
}

// 分类映射
const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
    FIN: { label: '财务', color: 'bg-blue-100 text-blue-700' },
    CUS: { label: '客户', color: 'bg-purple-100 text-purple-700' },
    OPS: { label: '运营', color: 'bg-green-100 text-green-700' },
    MKT: { label: '市场', color: 'bg-orange-100 text-orange-700' },
    HR: { label: '人力', color: 'bg-pink-100 text-pink-700' },
    RND: { label: '创新', color: 'bg-cyan-100 text-cyan-700' },
};

const getCategoryFromCode = (code: string): string => {
    const prefix = code.split('-')[0] || code.substring(0, 3);
    return prefix.toUpperCase();
};

const PERIOD_STATUS_MAP: Record<PeriodStatus, { label: string; color: string }> = {
    [PeriodStatus.DRAFT]: { label: '草稿', color: 'bg-slate-100 text-slate-600' },
    [PeriodStatus.ACTIVE]: { label: '进行中', color: 'bg-emerald-100 text-emerald-700' },
    [PeriodStatus.LOCKED]: { label: '已锁定', color: 'bg-amber-100 text-amber-700' },
    [PeriodStatus.ARCHIVED]: { label: '已归档', color: 'bg-slate-100 text-slate-500' },
};

const DRAFT_KEY = 'kpi_data_entry_draft';

// 统计卡片组件
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    iconBg: string;
    status?: 'success' | 'warning' | 'error' | 'default';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, iconBg, status = 'default' }) => {
    const statusColors = {
        success: 'text-emerald-600',
        warning: 'text-amber-500',
        error: 'text-red-500',
        default: 'text-slate-900',
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm text-slate-500 mb-1">{title}</p>
                    <p className={cn('text-2xl font-bold', statusColors[status])}>{value}</p>
                    {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
                </div>
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', iconBg)}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

// 数据录入卡片组件
interface EntryCardProps {
    entry: ManualEntry;
    index: number;
    employees: Employee[];
    assignments: KPIAssignmentDto[];
    onUpdate: (index: number, field: keyof ManualEntry, value: string) => void;
    onRemove: (index: number) => void;
    expanded: boolean;
    onToggle: () => void;
}

const EntryCard: React.FC<EntryCardProps> = ({
    entry, index, employees, assignments, onUpdate, onRemove, expanded, onToggle
}) => {
    const category = getCategoryFromCode(entry.kpiCode);
    const categoryInfo = CATEGORY_MAP[category] || { label: '其他', color: 'bg-slate-100 text-slate-600' };
    const hasValue = entry.actualValue !== '';
    const completionRate = hasValue && entry.targetValue > 0
        ? Math.round((parseFloat(entry.actualValue) / entry.targetValue) * 100)
        : 0;

    return (
        <div className={cn(
            'bg-white rounded-xl border shadow-sm transition-all',
            hasValue ? 'border-emerald-200' : 'border-slate-200'
        )}>
            {/* 卡片头部 - 始终显示 */}
            <div
                className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* 完成状态 */}
                        <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            hasValue ? 'bg-emerald-100' : 'bg-slate-100'
                        )}>
                            {hasValue ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                                <Clock className="w-4 h-4 text-slate-400" />
                            )}
                        </div>

                        {/* 员工信息 */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900 truncate">{entry.employeeName}</span>
                                <Badge variant="secondary" className={cn('text-xs flex-shrink-0', categoryInfo.color)}>
                                    {categoryInfo.label}
                                </Badge>
                            </div>
                            <p className="text-sm text-slate-500 truncate">{entry.kpiName}</p>
                        </div>

                        {/* 数值预览 */}
                        <div className="text-right flex-shrink-0 hidden sm:block">
                            <p className="text-sm text-slate-500">
                                {hasValue ? (
                                    <span className={cn(
                                        'font-semibold',
                                        completionRate >= 100 ? 'text-emerald-600' : completionRate >= 80 ? 'text-amber-500' : 'text-red-500'
                                    )}>
                                        {entry.actualValue} / {entry.targetValue} {entry.unit}
                                    </span>
                                ) : (
                                    <span className="text-slate-400">待填写</span>
                                )}
                            </p>
                            {hasValue && (
                                <p className="text-xs text-slate-400">完成率 {completionRate}%</p>
                            )}
                        </div>
                    </div>

                    {/* 展开/收起按钮 */}
                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 flex-shrink-0" aria-label={expanded ? '收起' : '展开'}>
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* 展开的编辑区域 */}
            {expanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-4">
                    {/* 员工和指标选择 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">员工</Label>
                            <Select value={entry.employeeId} onValueChange={v => onUpdate(index, 'employeeId', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map(e => (
                                        <SelectItem key={e.id} value={e.id}>
                                            {e.name} {e.department?.name && `(${e.department.name})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">KPI指标</Label>
                            <Select value={entry.assignmentId} onValueChange={v => onUpdate(index, 'assignmentId', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {assignments.map(a => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.kpiDefinition.code} - {a.kpiDefinition.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* 目标值和实际值 */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">目标值</Label>
                            <div className="h-10 px-3 flex items-center bg-slate-50 rounded-md text-slate-600">
                                {entry.targetValue} {entry.unit}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">实际值 <span className="text-red-500">*</span></Label>
                            <Input
                                type="number"
                                placeholder="请输入"
                                value={entry.actualValue}
                                onChange={e => onUpdate(index, 'actualValue', e.target.value)}
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label className="text-xs text-slate-500">备注</Label>
                            <Input
                                placeholder="可选备注信息"
                                value={entry.remark}
                                onChange={e => onUpdate(index, 'remark', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* 完成率进度条 */}
                    {hasValue && (
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">完成进度</span>
                                <span className={cn(
                                    'font-medium',
                                    completionRate >= 100 ? 'text-emerald-600' : completionRate >= 80 ? 'text-amber-500' : 'text-red-500'
                                )}>
                                    {completionRate}%
                                </span>
                            </div>
                            <Progress value={Math.min(completionRate, 100)} className="h-1.5" />
                        </div>
                    )}

                    {/* 删除按钮 */}
                    <div className="flex justify-end pt-2">
                        <Button variant="ghost" size="sm" onClick={() => onRemove(index)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4 mr-1" /> 删除此条
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

// 主组件
export const DataEntryView: React.FC = () => {
    const { t } = useTranslation();
    const { toast } = useToast();

    // 状态
    const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    const [assignments, setAssignments] = useState<KPIAssignmentDto[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [manualEntries, setManualEntries] = useState<ManualEntry[]>([]);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [hasDraft, setHasDraft] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [loading, setLoading] = useState(false);

    // 数据加载
    const loadPeriods = useCallback(async () => {
        try {
            const response = await assessmentApi.getPeriods();
            const allPeriods = response.data || [];
            const activePeriods = allPeriods.filter((p: AssessmentPeriod) =>
                p.status === PeriodStatus.ACTIVE || p.status === PeriodStatus.DRAFT
            );
            setPeriods(activePeriods);
            if (activePeriods.length > 0) setSelectedPeriod(activePeriods[0].id);
        } catch {
            toast({ variant: 'destructive', title: t('common.loadFailed') });
        }
    }, [toast, t]);

    const loadAssignments = useCallback(async () => {
        if (!selectedPeriod) return;
        try {
            const data = await assignmentApi.findByPeriod(selectedPeriod);
            setAssignments(data || []);
        } catch {
            toast({ variant: 'destructive', title: t('common.loadFailed') });
        }
    }, [selectedPeriod, toast, t]);

    const loadEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/employees');
            setEmployees(res.data?.data || []);
        } catch {
            toast({ variant: 'destructive', title: t('common.loadFailed') });
        } finally {
            setLoading(false);
        }
    }, [toast, t]);

    const checkDraft = useCallback(() => {
        try {
            const draft = localStorage.getItem(DRAFT_KEY);
            if (draft) {
                const data: DraftData = JSON.parse(draft);
                if (data.periodId === selectedPeriod) {
                    setHasDraft(true);
                } else {
                    setHasDraft(false);
                    setManualEntries([]); // 切换周期时清空当前录入数据
                }
                const savedTime = new Date(data.savedAt).getTime(); // 检查草稿是否过期（7天）
                const now = Date.now();
                if (now - savedTime > 7 * 24 * 60 * 60 * 1000) {
                    localStorage.removeItem(DRAFT_KEY);
                    setHasDraft(false);
                }
            } else {
                setManualEntries([]); // 无草稿时也清空
            }
        } catch {
            localStorage.removeItem(DRAFT_KEY);
            setHasDraft(false);
        }
    }, [selectedPeriod]);

    useEffect(() => {
        loadPeriods();
    }, [loadPeriods]);

    useEffect(() => {
        if (selectedPeriod) {
            loadAssignments();
            loadEmployees();
            checkDraft();
        }
    }, [selectedPeriod, loadAssignments, loadEmployees, checkDraft]);

    // 计算统计数据
    const stats = useMemo(() => {
        const total = manualEntries.length;
        const filled = manualEntries.filter(e => e.actualValue !== '').length;
        const pending = total - filled;
        const rate = total > 0 ? Math.round((filled / total) * 100) : 0;
        return { total, filled, pending, rate };
    }, [manualEntries]);

    const currentPeriod = useMemo(() => periods.find(p => p.id === selectedPeriod), [periods, selectedPeriod]);

    // 草稿操作
    const loadDraft = useCallback(() => {
        try {
            const draft = localStorage.getItem(DRAFT_KEY);
            if (draft) {
                const data: DraftData = JSON.parse(draft);
                if (data.periodId === selectedPeriod) {
                    setManualEntries(data.entries);
                    toast({ title: '草稿已加载', description: `共 ${data.entries.length} 条记录，保存于 ${data.savedAt}` });
                }
            }
        } catch {
            localStorage.removeItem(DRAFT_KEY);
            toast({ variant: 'destructive', title: '草稿加载失败', description: '草稿数据已损坏，已清除' });
        }
    }, [selectedPeriod, toast]);

    const saveDraft = useCallback(() => {
        const data: DraftData = {
            periodId: selectedPeriod,
            entries: manualEntries,
            savedAt: new Date().toLocaleString(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        setHasDraft(true);
        toast({ title: '草稿已保存' });
    }, [selectedPeriod, manualEntries, toast]);

    const clearDraft = useCallback(() => {
        localStorage.removeItem(DRAFT_KEY);
        setHasDraft(false);
        setManualEntries([]);
    }, []);

    // 条目操作
    const addEntry = useCallback(() => {
        if (employees.length === 0 || assignments.length === 0) {
            toast({ variant: 'destructive', title: '请先确保有员工和已分配的KPI指标' });
            return;
        }
        const emp = employees[0];
        const assign = assignments[0];
        const newEntry: ManualEntry = {
            id: `entry_${Date.now()}`,
            employeeId: emp.id,
            employeeName: emp.name,
            departmentName: emp.department?.name || '',
            assignmentId: assign.id,
            kpiCode: assign.kpiDefinition.code,
            kpiName: assign.kpiDefinition.name,
            targetValue: assign.targetValue,
            unit: assign.kpiDefinition.unit || '',
            actualValue: '',
            remark: '',
        };
        setManualEntries(prev => [...prev, newEntry]);
        setExpandedIndex(manualEntries.length); // 展开新添加的条目
    }, [employees, assignments, manualEntries.length, toast]);

    const updateEntry = useCallback((index: number, field: keyof ManualEntry, value: string) => {
        setManualEntries(prev => {
            const updated = [...prev];
            if (field === 'employeeId') {
                const emp = employees.find(e => e.id === value);
                if (emp) {
                    updated[index] = {
                        ...updated[index],
                        employeeId: value,
                        employeeName: emp.name,
                        departmentName: emp.department?.name || '',
                    };
                }
            } else if (field === 'assignmentId') {
                const assign = assignments.find(a => a.id === value);
                if (assign) {
                    updated[index] = {
                        ...updated[index],
                        assignmentId: value,
                        kpiCode: assign.kpiDefinition.code,
                        kpiName: assign.kpiDefinition.name,
                        targetValue: assign.targetValue,
                        unit: assign.kpiDefinition.unit || '',
                    };
                }
            } else {
                updated[index] = { ...updated[index], [field]: value };
            }
            return updated;
        });
    }, [employees, assignments]);

    const removeEntry = useCallback((index: number) => {
        setManualEntries(prev => prev.filter((_, i) => i !== index));
        if (expandedIndex === index) setExpandedIndex(null);
    }, [expandedIndex]);

    // 提交数据
    const submitEntries = useCallback(async () => {
        const validEntries = manualEntries.filter(e => e.actualValue !== '');
        if (validEntries.length === 0) {
            toast({ variant: 'destructive', title: '请至少填写一条数据的实际值' });
            return;
        }

        try {
            const submission = await apiClient.post('/assessment/submissions', {
                periodId: selectedPeriod,
                dataSource: 'manual',
            });

            await apiClient.post('/assessment/entries/bulk', {
                submissionId: submission.data.id,
                entries: validEntries.map(e => ({
                    assignmentId: e.assignmentId,
                    employeeId: e.employeeId,
                    actualValue: parseFloat(e.actualValue),
                    remark: e.remark || undefined,
                })),
            });

            toast({ title: '提交成功', description: `成功提交 ${validEntries.length} 条数据` });
            clearDraft();
        } catch {
            toast({ variant: 'destructive', title: '提交失败' });
        }
    }, [manualEntries, selectedPeriod, toast, clearDraft]);

    // Excel操作
    const handleDownload = useCallback(async () => {
        if (!selectedPeriod) return;
        try {
            const blob = await assessmentApi.downloadTemplate(selectedPeriod);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `KPI数据模板_${currentPeriod?.name || selectedPeriod}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            toast({ title: '模板下载成功' });
        } catch {
            toast({ variant: 'destructive', title: '下载失败' });
        }
    }, [selectedPeriod, currentPeriod, toast]);

    const handleUpload = useCallback(async (file: File) => {
        if (!file || !selectedPeriod) return;
        setUploading(true);
        setUploadProgress(0);

        // 模拟进度
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
            await assessmentApi.uploadData(selectedPeriod, file);
            setUploadProgress(100);
            toast({ title: '上传成功', description: '数据已导入系统' });
        } catch {
            toast({ variant: 'destructive', title: '上传失败' });
        } finally {
            clearInterval(progressInterval);
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 500);
        }
    }, [selectedPeriod, toast]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
        e.target.value = '';
    }, [handleUpload]);

    // 拖拽上传
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.xlsx')) {
            handleUpload(file);
        } else {
            toast({ variant: 'destructive', title: '请上传 .xlsx 格式的文件' });
        }
    }, [handleUpload, toast]);

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">数据填报</h1>
                    <p className="text-slate-500">录入员工KPI实际完成数据</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* 周期选择 */}
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="选择考核周期" />
                        </SelectTrigger>
                        <SelectContent>
                            {periods.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                    <div className="flex items-center gap-2">
                                        <span>{p.name}</span>
                                        <Badge variant="secondary" className={cn('text-xs', PERIOD_STATUS_MAP[p.status]?.color)}>
                                            {PERIOD_STATUS_MAP[p.status]?.label}
                                        </Badge>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {hasDraft && (
                        <Button variant="outline" onClick={loadDraft}>
                            <RefreshCw className="mr-2 h-4 w-4" /> 加载草稿
                        </Button>
                    )}
                </div>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="可用指标"
                    value={assignments.length}
                    subtitle={`${employees.length} 名员工`}
                    icon={<Target className="w-5 h-5 text-brand-primary" />}
                    iconBg="bg-primary/10"
                />
                <StatCard
                    title="待填报"
                    value={stats.total}
                    subtitle="本次录入条目"
                    icon={<FileSpreadsheet className="w-5 h-5 text-amber-500" />}
                    iconBg="bg-amber-50"
                />
                <StatCard
                    title="已填写"
                    value={stats.filled}
                    subtitle={`待填写 ${stats.pending} 条`}
                    icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    iconBg="bg-emerald-50"
                    status={stats.filled > 0 ? 'success' : 'default'}
                />
                <StatCard
                    title="完成率"
                    value={`${stats.rate}%`}
                    subtitle={stats.rate === 100 ? '全部完成' : '继续加油'}
                    icon={<Users className="w-5 h-5 text-purple-500" />}
                    iconBg="bg-purple-50"
                    status={stats.rate === 100 ? 'success' : stats.rate >= 50 ? 'warning' : 'default'}
                />
            </div>

            {/* 数据录入标签页 */}
            <Tabs defaultValue="manual" className="space-y-6">
                <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
                    <TabsTrigger value="manual" className="gap-2">
                        <Users className="h-4 w-4" /> 手动录入
                    </TabsTrigger>
                    <TabsTrigger value="excel" className="gap-2">
                        <FileSpreadsheet className="h-4 w-4" /> Excel导入
                    </TabsTrigger>
                </TabsList>

                {/* 手动录入 */}
                <TabsContent value="manual" className="space-y-4">
                    {/* 操作栏 */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <p className="text-sm text-slate-500">
                            逐条录入员工KPI实际完成值，支持草稿保存
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={saveDraft} disabled={manualEntries.length === 0}>
                                <Save className="mr-2 h-4 w-4" /> 保存草稿
                            </Button>
                            <Button size="sm" onClick={addEntry}>
                                <Plus className="mr-2 h-4 w-4" /> 添加记录
                            </Button>
                        </div>
                    </div>

                    {/* 填报进度 */}
                    {manualEntries.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">填报进度</span>
                                <span className={cn(
                                    'text-sm font-semibold',
                                    stats.rate === 100 ? 'text-emerald-600' : 'text-amber-500'
                                )}>
                                    {stats.filled} / {stats.total} 条
                                </span>
                            </div>
                            <Progress value={stats.rate} className="h-2" />
                        </div>
                    )}

                    {/* 录入卡片列表 */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
                        </div>
                    ) : manualEntries.length === 0 ? (
                        <EmptyState
                            icon={FileSpreadsheet}
                            title="暂无录入记录"
                            description="点击下方按钮开始录入数据"
                            action={
                                <Button onClick={addEntry}>
                                    <Plus className="mr-2 h-4 w-4" /> 添加第一条记录
                                </Button>
                            }
                        />
                    ) : (
                        <div className="space-y-3">
                            {manualEntries.map((entry, index) => (
                                <EntryCard
                                    key={entry.id}
                                    entry={entry}
                                    index={index}
                                    employees={employees}
                                    assignments={assignments}
                                    onUpdate={updateEntry}
                                    onRemove={removeEntry}
                                    expanded={expandedIndex === index}
                                    onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
                                />
                            ))}
                        </div>
                    )}

                    {/* 提交按钮 */}
                    {manualEntries.length > 0 && (
                        <div className="flex justify-center sm:justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={clearDraft}>
                                <X className="mr-2 h-4 w-4" /> 清空全部
                            </Button>
                            <Button onClick={submitEntries} disabled={stats.filled === 0}>
                                <Send className="mr-2 h-4 w-4" /> 提交数据 ({stats.filled} 条)
                            </Button>
                        </div>
                    )}
                </TabsContent>

                {/* Excel导入 */}
                <TabsContent value="excel" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* 下载模板 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Download className="h-5 w-5 text-brand-primary" />
                                    下载数据模板
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-slate-500">
                                    下载当前周期的Excel模板，填写员工实际完成数据后上传
                                </p>
                                <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                                    <p className="font-medium mb-1">模板包含：</p>
                                    <ul className="list-disc list-inside space-y-1 text-slate-500">
                                        <li>已分配的 {assignments.length} 个KPI指标</li>
                                        <li>员工信息和目标值</li>
                                        <li>实际值填写列</li>
                                    </ul>
                                </div>
                                <Button onClick={handleDownload} disabled={!selectedPeriod} className="w-full">
                                    <Download className="mr-2 h-4 w-4" /> 下载Excel模板
                                </Button>
                            </CardContent>
                        </Card>

                        {/* 上传数据 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Upload className="h-5 w-5 text-emerald-600" />
                                    上传填报数据
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-slate-500">
                                    上传填写好的Excel文件，系统将自动导入数据
                                </p>

                                {/* 拖拽上传区域 */}
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={cn(
                                        'relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer',
                                        isDragOver ? 'border-brand-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                                        uploading && 'pointer-events-none'
                                    )}
                                >
                                    <input
                                        type="file"
                                        accept=".xlsx"
                                        onChange={handleFileInput}
                                        disabled={uploading || !selectedPeriod}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />

                                    {uploading ? (
                                        <div className="space-y-3">
                                            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                                                <FileUp className="w-6 h-6 text-brand-primary animate-pulse" />
                                            </div>
                                            <p className="text-sm text-slate-600">正在上传...</p>
                                            <Progress value={uploadProgress} className="h-2 max-w-xs mx-auto" />
                                            <p className="text-xs text-slate-400">{uploadProgress}%</p>
                                        </div>
                                    ) : (
                                        <>
                                            <FileUp className={cn(
                                                'w-10 h-10 mx-auto mb-3',
                                                isDragOver ? 'text-brand-primary' : 'text-slate-400'
                                            )} />
                                            <p className="text-sm text-slate-600 mb-1">
                                                {isDragOver ? '松开鼠标上传文件' : '拖拽文件到此处，或点击选择'}
                                            </p>
                                            <p className="text-xs text-slate-400">仅支持 .xlsx 格式</p>
                                        </>
                                    )}
                                </div>

                                {/* 提示 */}
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                                    <AlertCircle className="h-4 w-4 inline-block mr-2" />
                                    上传前请确保使用下载的模板格式，避免导入失败
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};
