import React, { useEffect, useState, useCallback, memo } from 'react';
import { Plus, Trash2, Copy, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { assignmentApi, KPIAssignmentDto, CreateAssignmentDto } from '@/api/assignment.api';
import { assessmentApi } from '@/api/assessment.api';
import { kpiLibraryApi } from '@/api/kpi-library.api';
import { AssessmentPeriod, KPIDefinition, PeriodStatus } from '@/types';

interface AssignmentFormData {
    kpiDefinitionId: string;
    departmentId: string;
    targetValue: string;
    challengeValue: string;
    weight: string;
}

const INITIAL_FORM: AssignmentFormData = {
    kpiDefinitionId: '',
    departmentId: '',
    targetValue: '',
    challengeValue: '',
    weight: '10',
};

export const AssignmentView: React.FC = memo(() => {
    const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    const [assignments, setAssignments] = useState<KPIAssignmentDto[]>([]);
    const [kpis, setKpis] = useState<KPIDefinition[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
    const [sourcePeriod, setSourcePeriod] = useState('');
    const [form, setForm] = useState<AssignmentFormData>(INITIAL_FORM);
    const { toast } = useToast();

    const loadPeriods = useCallback(async () => {
        try {
            const res = await assessmentApi.getPeriods();
            setPeriods(res.data || []);
            const activePeriod = res.data?.find((p: AssessmentPeriod) => 
                p.status === PeriodStatus.DRAFT || p.status === PeriodStatus.ACTIVE
            );
            if (activePeriod) setSelectedPeriod(activePeriod.id);
        } catch { toast({ variant: 'destructive', title: '加载周期失败' }); }
    }, [toast]);

    const loadKPIs = useCallback(async () => {
        try {
            const res = await kpiLibraryApi.findAll({ isActive: true });
            setKpis(res.data || []);
        } catch { toast({ variant: 'destructive', title: '加载指标失败' }); }
    }, [toast]);

    const loadAssignments = useCallback(async () => {
        if (!selectedPeriod) return;
        setLoading(true);
        try {
            const data = await assignmentApi.findByPeriod(selectedPeriod);
            setAssignments(data || []);
        } catch { toast({ variant: 'destructive', title: '加载分配失败' }); }
        finally { setLoading(false); }
    }, [selectedPeriod, toast]);

    useEffect(() => { loadPeriods(); loadKPIs(); }, [loadPeriods, loadKPIs]);
    useEffect(() => { loadAssignments(); }, [loadAssignments]);

    const handleCreate = useCallback(async () => {
        if (!form.kpiDefinitionId || !form.targetValue) {
            toast({ variant: 'destructive', title: '请填写必填项' });
            return;
        }
        try {
            const dto: CreateAssignmentDto = {
                kpiDefinitionId: form.kpiDefinitionId,
                periodId: selectedPeriod,
                departmentId: form.departmentId || undefined,
                targetValue: parseFloat(form.targetValue),
                challengeValue: form.challengeValue ? parseFloat(form.challengeValue) : undefined,
                weight: parseFloat(form.weight) || 10,
            };
            await assignmentApi.create(dto);
            toast({ title: '分配成功' });
            setIsDialogOpen(false);
            setForm(INITIAL_FORM);
            loadAssignments();
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            toast({ variant: 'destructive', title: '分配失败', description: err.response?.data?.message });
        }
    }, [form, selectedPeriod, toast, loadAssignments]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm('确定删除此分配？')) return;
        try {
            await assignmentApi.remove(id);
            toast({ title: '删除成功' });
            loadAssignments();
        } catch { toast({ variant: 'destructive', title: '删除失败' }); }
    }, [toast, loadAssignments]);

    const handleCopy = useCallback(async () => {
        if (!sourcePeriod || !selectedPeriod) return;
        try {
            const res = await assignmentApi.copyFromPeriod(sourcePeriod, selectedPeriod);
            toast({ title: '复制成功', description: res.message });
            setIsCopyDialogOpen(false);
            loadAssignments();
        } catch { toast({ variant: 'destructive', title: '复制失败' }); }
    }, [sourcePeriod, selectedPeriod, toast, loadAssignments]);

    const currentPeriod = periods.find(p => p.id === selectedPeriod);
    const isLocked = currentPeriod?.status === PeriodStatus.LOCKED;
    const totalWeight = assignments.reduce((sum, a) => sum + a.weight, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">指标分配</h2>
                    <p className="text-muted-foreground">将KPI指标分配到部门或员工</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsCopyDialogOpen(true)} disabled={isLocked}>
                        <Copy className="mr-2 h-4 w-4" /> 从其他周期复制
                    </Button>
                    <Button onClick={() => setIsDialogOpen(true)} disabled={isLocked}>
                        <Plus className="mr-2 h-4 w-4" /> 新增分配
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Label>考核周期</Label>
                            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="选择周期" />
                                </SelectTrigger>
                                <SelectContent>
                                    {periods.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Target className="h-4 w-4" />
                            <span>权重合计: <strong className={totalWeight === 100 ? 'text-green-600' : 'text-orange-500'}>{totalWeight}%</strong></span>
                            {totalWeight !== 100 && <span className="text-orange-500">(应为100%)</span>}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>指标编码</TableHead>
                                <TableHead>指标名称</TableHead>
                                <TableHead>目标值</TableHead>
                                <TableHead>挑战值</TableHead>
                                <TableHead>权重</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center">加载中...</TableCell></TableRow>
                            ) : assignments.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">暂无分配，请点击"新增分配"</TableCell></TableRow>
                            ) : assignments.map(a => (
                                <TableRow key={a.id}>
                                    <TableCell className="font-mono">{a.kpiDefinition.code}</TableCell>
                                    <TableCell>{a.kpiDefinition.name}</TableCell>
                                    <TableCell>{a.targetValue} {a.kpiDefinition.unit || ''}</TableCell>
                                    <TableCell>{a.challengeValue || '-'}</TableCell>
                                    <TableCell>{a.weight}%</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)} disabled={isLocked}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>新增指标分配</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>选择指标 *</Label>
                            <Select value={form.kpiDefinitionId} onValueChange={v => setForm(f => ({ ...f, kpiDefinitionId: v }))}>
                                <SelectTrigger><SelectValue placeholder="选择KPI指标" /></SelectTrigger>
                                <SelectContent>
                                    {kpis.map(k => (
                                        <SelectItem key={k.id} value={k.id}>{k.code} - {k.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>目标值 *</Label>
                                <Input type="number" value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>挑战值</Label>
                                <Input type="number" value={form.challengeValue} onChange={e => setForm(f => ({ ...f, challengeValue: e.target.value }))} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>权重 (%)</Label>
                            <Input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                        <Button onClick={handleCreate}>确定</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>从其他周期复制分配</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>源周期</Label>
                            <Select value={sourcePeriod} onValueChange={setSourcePeriod}>
                                <SelectTrigger><SelectValue placeholder="选择源周期" /></SelectTrigger>
                                <SelectContent>
                                    {periods.filter(p => p.id !== selectedPeriod).map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCopyDialogOpen(false)}>取消</Button>
                        <Button onClick={handleCopy}>复制</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
});

AssignmentView.displayName = 'AssignmentView';
