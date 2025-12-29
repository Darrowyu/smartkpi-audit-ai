import React, { useEffect, useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Clock, Eye, FileText, Calendar, User, RotateCcw, ChevronRight, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { assessmentApi } from '@/api/assessment.api';
import { AssessmentPeriod, PeriodStatus } from '@/types';
import { cn } from '@/lib/utils';
import { TableRowSkeleton } from '@/components/ui/skeleton';

interface Submission {
    id: string;
    periodId: string;
    period: { name: string };
    dataSource: string;
    version: number;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
    approvalStage?: 'SELF_EVAL' | 'MANAGER_REVIEW' | 'SKIP_LEVEL' | 'HR_CONFIRM' | 'COMPLETED';
    submittedAt?: string;
    submittedBy?: { username: string };
    approvedAt?: string;
    approvedBy?: { username: string };
    rejectReason?: string;
    createdAt: string;
    _count: { dataEntries: number };
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    DRAFT: { label: '草稿', color: 'bg-slate-100 text-slate-600', icon: <FileText className="w-3 h-3" /> },
    PENDING: { label: '待审批', color: 'bg-amber-100 text-amber-700', icon: <Clock className="w-3 h-3" /> },
    APPROVED: { label: '已通过', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="w-3 h-3" /> },
    REJECTED: { label: '已驳回', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
};

const STAGE_MAP: Record<string, { label: string; color: string; step: number }> = {
    SELF_EVAL: { label: '自评提交', color: 'bg-primary/10 text-primary', step: 1 },
    MANAGER_REVIEW: { label: '主管审核', color: 'bg-amber-100 text-amber-700', step: 2 },
    SKIP_LEVEL: { label: '隔级审核', color: 'bg-purple-100 text-purple-700', step: 3 },
    HR_CONFIRM: { label: 'HR确认', color: 'bg-cyan-100 text-cyan-700', step: 4 },
    COMPLETED: { label: '已完成', color: 'bg-emerald-100 text-emerald-700', step: 5 },
};

const SOURCE_MAP: Record<string, string> = {
    manual: '手动录入',
    excel: 'Excel导入',
    self_evaluation: '员工自评',
};

export const DataApprovalView: React.FC = memo(() => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectTarget, setRejectTarget] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [activeTab, setActiveTab] = useState<string>('pending');
    const [approvalComment, setApprovalComment] = useState('');

    const loadPeriods = useCallback(async () => {
        try {
            const response = await assessmentApi.getPeriods();
            setPeriods(response.data || []);
        } catch {
            toast({ variant: 'destructive', title: t('common.loadFailed') });
        }
    }, [toast, t]);

    const loadSubmissions = useCallback(async () => {
        setLoading(true);
        try {
            const data = await assessmentApi.getSubmissions(selectedPeriod === 'all' ? undefined : selectedPeriod);
            setSubmissions(data || []);
        } catch {
            toast({ variant: 'destructive', title: t('common.loadFailed') });
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod, toast, t]);

    useEffect(() => { loadPeriods(); }, [loadPeriods]);
    useEffect(() => { loadSubmissions(); }, [loadSubmissions]);

    const handleApprove = async (id: string, comment?: string) => {
        setProcessing(true);
        try {
            await assessmentApi.approveSubmission(id);
            toast({ title: '审批通过', description: '数据已流转至下一审批阶段' });
            setDetailDialogOpen(false);
            setApprovalComment('');
            loadSubmissions();
        } catch {
            toast({ variant: 'destructive', title: '操作失败' });
        } finally {
            setProcessing(false);
        }
    };

    const handleReturn = async (id: string) => {
        setProcessing(true);
        try {
            await assessmentApi.rejectSubmission(id, '退回修改');
            toast({ title: '已退回', description: '数据已退回上一阶段' });
            setDetailDialogOpen(false);
            loadSubmissions();
        } catch {
            toast({ variant: 'destructive', title: '操作失败' });
        } finally {
            setProcessing(false);
        }
    };

    const openDetailDialog = (sub: Submission) => {
        setSelectedSubmission(sub);
        setApprovalComment('');
        setDetailDialogOpen(true);
    };

    const handleReject = async () => {
        if (!rejectTarget || !rejectReason.trim()) {
            toast({ variant: 'destructive', title: '请填写驳回原因' });
            return;
        }
        setProcessing(true);
        try {
            await assessmentApi.rejectSubmission(rejectTarget, rejectReason);
            toast({ title: '已驳回', description: '数据提交已驳回' });
            setRejectDialogOpen(false);
            setRejectTarget(null);
            setRejectReason('');
            loadSubmissions();
        } catch {
            toast({ variant: 'destructive', title: '操作失败' });
        } finally {
            setProcessing(false);
        }
    };

    const openRejectDialog = (id: string) => {
        setRejectTarget(id);
        setRejectReason('');
        setRejectDialogOpen(true);
    };

    const pendingCount = submissions.filter(s => s.status === 'PENDING').length;
    const filteredSubmissions = activeTab === 'all' ? submissions : submissions.filter(s => {
        if (activeTab === 'pending') return s.status === 'PENDING';
        if (activeTab === 'approved') return s.status === 'APPROVED';
        if (activeTab === 'rejected') return s.status === 'REJECTED';
        return true;
    });

    const ApprovalStageProgress: React.FC<{ stage?: string }> = ({ stage }) => {
        const currentStep = stage ? (STAGE_MAP[stage]?.step || 1) : 1;
        return (
            <div className="flex items-center gap-1">
                {Object.entries(STAGE_MAP).slice(0, 4).map(([key, info], idx) => (
                    <React.Fragment key={key}>
                        <div className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                            currentStep > info.step ? 'bg-emerald-500 text-white' :
                            currentStep === info.step ? 'bg-brand-primary text-brand-text' :
                            'bg-slate-200 text-slate-500'
                        )}>
                            {currentStep > info.step ? <CheckCircle className="w-4 h-4" /> : info.step}
                        </div>
                        {idx < 3 && <div className={cn('w-4 h-0.5', currentStep > info.step ? 'bg-emerald-500' : 'bg-slate-200')} />}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">数据审批</h1>
                    <p className="text-slate-500">多级审批流程：自评 → 主管审核 → 隔级审核 → HR确认</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="w-[200px]">
                            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                            <SelectValue placeholder="选择考核周期" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部周期</SelectItem>
                            {periods.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
                        <p className="text-sm text-slate-500">待审批</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-emerald-600">
                            {submissions.filter(s => s.status === 'APPROVED').length}
                        </div>
                        <p className="text-sm text-slate-500">已通过</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-red-600">
                            {submissions.filter(s => s.status === 'REJECTED').length}
                        </div>
                        <p className="text-sm text-slate-500">已驳回</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-slate-600">{submissions.length}</div>
                        <p className="text-sm text-slate-500">总提交数</p>
                    </CardContent>
                </Card>
            </div>

            {/* 提交列表 */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>审批列表</CardTitle>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList>
                                <TabsTrigger value="pending" className="gap-1">
                                    <Clock className="w-3 h-3" /> 待审批 ({pendingCount})
                                </TabsTrigger>
                                <TabsTrigger value="approved">已通过</TabsTrigger>
                                <TabsTrigger value="rejected">已驳回</TabsTrigger>
                                <TabsTrigger value="all">全部</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>考核周期</TableHead>
                                <TableHead>数据来源</TableHead>
                                <TableHead className="text-center">数据条数</TableHead>
                                <TableHead>提交人</TableHead>
                                <TableHead>审批进度</TableHead>
                                <TableHead>状态</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} columns={7} />)
                            ) : filteredSubmissions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">暂无提交记录</TableCell>
                                </TableRow>
                            ) : (
                                filteredSubmissions.map(sub => {
                                    const statusInfo = STATUS_MAP[sub.status] || STATUS_MAP.DRAFT;
                                    const stageInfo = sub.approvalStage ? STAGE_MAP[sub.approvalStage] : STAGE_MAP.SELF_EVAL;
                                    return (
                                        <TableRow key={sub.id}>
                                            <TableCell className="font-medium">{sub.period?.name}</TableCell>
                                            <TableCell>{SOURCE_MAP[sub.dataSource] || sub.dataSource}</TableCell>
                                            <TableCell className="text-center">{sub._count.dataEntries}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <User className="w-3 h-3 text-slate-400" />
                                                    {sub.submittedBy?.username || '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <ApprovalStageProgress stage={sub.approvalStage} />
                                                    <span className="text-xs text-slate-500">{stageInfo?.label}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn('gap-1', statusInfo.color)}>
                                                    {statusInfo.icon}
                                                    {statusInfo.label}
                                                </Badge>
                                                {sub.status === 'REJECTED' && sub.rejectReason && (
                                                    <p className="text-xs text-red-500 mt-1">原因: {sub.rejectReason}</p>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {sub.status === 'PENDING' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openDetailDialog(sub)}
                                                                className="text-primary hover:opacity-80"
                                                            >
                                                                <Eye className="w-4 h-4 mr-1" /> 审批
                                                            </Button>
                                                        </>
                                                    )}
                                                    {sub.status !== 'PENDING' && (
                                                        <Button size="sm" variant="ghost" onClick={() => openDetailDialog(sub)}>
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* 审批详情对话框 */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>审批详情</DialogTitle>
                    </DialogHeader>
                    {selectedSubmission && (
                        <div className="space-y-6 py-4">
                            {/* 审批进度 */}
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <h4 className="text-sm font-medium mb-3">审批进度</h4>
                                <div className="flex items-center justify-between">
                                    {Object.entries(STAGE_MAP).slice(0, 4).map(([key, info], idx) => {
                                        const currentStep = selectedSubmission.approvalStage ? (STAGE_MAP[selectedSubmission.approvalStage]?.step || 1) : 1;
                                        const isCompleted = currentStep > info.step;
                                        const isCurrent = currentStep === info.step;
                                        return (
                                            <React.Fragment key={key}>
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className={cn(
                                                        'w-10 h-10 rounded-full flex items-center justify-center',
                                                        isCompleted ? 'bg-emerald-500 text-white' :
                                                        isCurrent ? 'bg-brand-primary text-brand-text' :
                                                        'bg-slate-200 text-slate-500'
                                                    )}>
                                                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : info.step}
                                                    </div>
                                                    <span className={cn('text-xs', isCurrent ? 'text-primary font-medium' : 'text-slate-500')}>{info.label}</span>
                                                </div>
                                                {idx < 3 && <ChevronRight className="w-5 h-5 text-slate-300" />}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 基本信息 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm text-slate-500">考核周期</span>
                                    <p className="font-medium">{selectedSubmission.period?.name}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-slate-500">数据来源</span>
                                    <p className="font-medium">{SOURCE_MAP[selectedSubmission.dataSource] || selectedSubmission.dataSource}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-slate-500">提交人</span>
                                    <p className="font-medium">{selectedSubmission.submittedBy?.username || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-slate-500">数据条数</span>
                                    <p className="font-medium">{selectedSubmission._count.dataEntries} 条</p>
                                </div>
                            </div>

                            {/* 审批操作 */}
                            {selectedSubmission.status === 'PENDING' && (
                                <div className="space-y-3 pt-4 border-t">
                                    <div>
                                        <label className="text-sm font-medium">审批意见（可选）</label>
                                        <Textarea
                                            placeholder="请输入审批意见..."
                                            value={approvalComment}
                                            onChange={e => setApprovalComment(e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        {selectedSubmission?.status === 'PENDING' ? (
                            <>
                                <Button variant="outline" onClick={() => handleReturn(selectedSubmission.id)} disabled={processing}>
                                    <RotateCcw className="w-4 h-4 mr-1" /> 退回修改
                                </Button>
                                <Button variant="outline" onClick={() => openRejectDialog(selectedSubmission.id)} className="text-red-600">
                                    <XCircle className="w-4 h-4 mr-1" /> 驳回
                                </Button>
                                <Button onClick={() => handleApprove(selectedSubmission.id, approvalComment)} disabled={processing}>
                                    <CheckCircle className="w-4 h-4 mr-1" /> 通过审批
                                </Button>
                            </>
                        ) : (
                            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>关闭</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 驳回对话框 */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>驳回提交</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder="请填写驳回原因..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>取消</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={processing}>
                            确认驳回
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
});

DataApprovalView.displayName = 'DataApprovalView';
