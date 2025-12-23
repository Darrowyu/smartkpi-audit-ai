import React, { useEffect, useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Copy, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
    const { t } = useTranslation();
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
        } catch { toast({ variant: 'destructive', title: t('common.loadFailed') }); }
    }, [toast, t]);

    const loadKPIs = useCallback(async () => {
        try {
            const res = await kpiLibraryApi.findAll({ isActive: true });
            setKpis(res.data || []);
        } catch { toast({ variant: 'destructive', title: t('common.loadFailed') }); }
    }, [toast, t]);

    const loadAssignments = useCallback(async () => {
        if (!selectedPeriod) return;
        setLoading(true);
        try {
            const data = await assignmentApi.findByPeriod(selectedPeriod);
            setAssignments(data || []);
        } catch { toast({ variant: 'destructive', title: t('common.loadFailed') }); }
        finally { setLoading(false); }
    }, [selectedPeriod, toast, t]);

    useEffect(() => { loadPeriods(); loadKPIs(); }, [loadPeriods, loadKPIs]);
    useEffect(() => { loadAssignments(); }, [loadAssignments]);

    const handleCreate = useCallback(async () => {
        if (!form.kpiDefinitionId || !form.targetValue) {
            toast({ variant: 'destructive', title: t('assignment.fillRequired') });
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
            toast({ title: t('assignment.createAssignment') });
            setIsDialogOpen(false);
            setForm(INITIAL_FORM);
            loadAssignments();
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            toast({ variant: 'destructive', title: t('assignment.assignFailed'), description: err.response?.data?.message });
        }
    }, [form, selectedPeriod, toast, loadAssignments, t]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm(t('assignment.deleteConfirm'))) return;
        try {
            await assignmentApi.remove(id);
            toast({ title: t('assignment.deleteSuccess') });
            loadAssignments();
        } catch { toast({ variant: 'destructive', title: t('assignment.deleteFailed') }); }
    }, [toast, loadAssignments, t]);

    const handleCopy = useCallback(async () => {
        if (!sourcePeriod || !selectedPeriod) return;
        try {
            const res = await assignmentApi.copyFromPeriod(sourcePeriod, selectedPeriod);
            toast({ title: t('assignment.copySuccess'), description: res.message });
            setIsCopyDialogOpen(false);
            loadAssignments();
        } catch { toast({ variant: 'destructive', title: t('assignment.copyFailed') }); }
    }, [sourcePeriod, selectedPeriod, toast, loadAssignments, t]);

    const currentPeriod = periods.find(p => p.id === selectedPeriod);
    const isLocked = currentPeriod?.status === PeriodStatus.LOCKED;
    const totalWeight = assignments.reduce((sum, a) => sum + a.weight, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('assignment.title')}</h2>
                    <p className="text-muted-foreground">{t('assignment.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsCopyDialogOpen(true)} disabled={isLocked}>
                        <Copy className="mr-2 h-4 w-4" /> {t('assignment.copySuccess').split(' ')[0]}
                    </Button>
                    <Button onClick={() => setIsDialogOpen(true)} disabled={isLocked}>
                        <Plus className="mr-2 h-4 w-4" /> {t('assignment.newAssignment')}
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Label>{t('assignment.selectPeriod')}</Label>
                            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder={t('dashboardView.selectPeriod')} />
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
                            <span>{t('assignment.totalWeight')}: <strong className={totalWeight === 100 ? 'text-green-600' : 'text-orange-500'}>{totalWeight}%</strong></span>
                            {totalWeight !== 100 && <span className="text-orange-500">{t('assignment.shouldBe100')}</span>}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('assignment.kpiCode')}</TableHead>
                                <TableHead>{t('assignment.kpiName')}</TableHead>
                                <TableHead>{t('assignment.targetValue')}</TableHead>
                                <TableHead>{t('assignment.challengeValue')}</TableHead>
                                <TableHead>{t('assignment.weight')}</TableHead>
                                <TableHead className="text-right">{t('assignment.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center">{t('loading')}</TableCell></TableRow>
                            ) : assignments.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('assignment.noData')}</TableCell></TableRow>
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
                    <DialogHeader><DialogTitle>{t('assignment.createAssignment')}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('assignment.selectKPI')} *</Label>
                            <Select value={form.kpiDefinitionId} onValueChange={v => setForm(f => ({ ...f, kpiDefinitionId: v }))}>
                                <SelectTrigger><SelectValue placeholder={t('assignment.selectKPI')} /></SelectTrigger>
                                <SelectContent>
                                    {kpis.map(k => (
                                        <SelectItem key={k.id} value={k.id}>{k.code} - {k.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('assignment.targetValue')} *</Label>
                                <Input type="number" value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('assignment.challengeValue')}</Label>
                                <Input type="number" value={form.challengeValue} onChange={e => setForm(f => ({ ...f, challengeValue: e.target.value }))} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('assignment.weight')} (%)</Label>
                            <Input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('cancel')}</Button>
                        <Button onClick={handleCreate}>{t('common.confirm')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{t('assignment.copySuccess')}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('assignment.selectPeriod')}</Label>
                            <Select value={sourcePeriod} onValueChange={setSourcePeriod}>
                                <SelectTrigger><SelectValue placeholder={t('dashboardView.selectPeriod')} /></SelectTrigger>
                                <SelectContent>
                                    {periods.filter(p => p.id !== selectedPeriod).map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCopyDialogOpen(false)}>{t('cancel')}</Button>
                        <Button onClick={handleCopy}>{t('assignment.copySuccess').split(' ')[0]}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
});

AssignmentView.displayName = 'AssignmentView';
