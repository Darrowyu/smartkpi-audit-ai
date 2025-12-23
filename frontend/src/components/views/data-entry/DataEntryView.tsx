import React, { useEffect, useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload, Plus, Save, Send } from 'lucide-react';
import { assessmentApi } from '@/api/assessment.api';
import { assignmentApi, KPIAssignmentDto } from '@/api/assignment.api';
import { AssessmentPeriod, PeriodStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/api/client';

interface ManualEntry {
    employeeId: string;
    employeeName: string;
    assignmentId: string;
    kpiName: string;
    targetValue: number;
    actualValue: string;
    remark: string;
}

interface DraftData {
    periodId: string;
    entries: ManualEntry[];
    savedAt: string;
}

const DRAFT_KEY = 'kpi_data_entry_draft';

export const DataEntryView: React.FC = memo(() => {
    const { t } = useTranslation();
    const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    const [assignments, setAssignments] = useState<KPIAssignmentDto[]>([]);
    const [employees, setEmployees] = useState<{ id: string; employeeId: string; name: string }[]>([]);
    const [manualEntries, setManualEntries] = useState<ManualEntry[]>([]);
    const [uploading, setUploading] = useState(false);
    const [hasDraft, setHasDraft] = useState(false);
    const { toast } = useToast();

    useEffect(() => { loadPeriods(); }, []);

    useEffect(() => {
        if (selectedPeriod) {
            loadAssignments();
            loadEmployees();
            checkDraft();
        }
    }, [selectedPeriod]);

    const loadPeriods = async () => {
        try {
            const response = await assessmentApi.getPeriods();
            const allPeriods = response.data || [];
            const activePeriods = allPeriods.filter((p: AssessmentPeriod) =>
                p.status === PeriodStatus.ACTIVE || p.status === PeriodStatus.DRAFT
            );
            setPeriods(activePeriods);
            if (activePeriods.length > 0) setSelectedPeriod(activePeriods[0].id);
        } catch { toast({ variant: 'destructive', title: t('common.loadFailed') }); }
    };

    const loadAssignments = async () => {
        try {
            const data = await assignmentApi.findByPeriod(selectedPeriod);
            setAssignments(data || []);
        } catch { toast({ variant: 'destructive', title: t('common.loadFailed') }); }
    };

    const loadEmployees = async () => {
        try {
            const res = await apiClient.get('/employees');
            setEmployees(res.data?.data || []);
        } catch { toast({ variant: 'destructive', title: t('common.loadFailed') }); }
    };

    const checkDraft = () => {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
            const data: DraftData = JSON.parse(draft);
            if (data.periodId === selectedPeriod) {
                setHasDraft(true);
            }
        }
    };

    const loadDraft = useCallback(() => {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
            const data: DraftData = JSON.parse(draft);
            if (data.periodId === selectedPeriod) {
                setManualEntries(data.entries);
                toast({ title: t('dataEntry.draftLoaded'), description: t('dataEntry.draftLoadedDesc', { count: data.entries.length, time: data.savedAt }) });
            }
        }
    }, [selectedPeriod, toast, t]);

    const saveDraft = useCallback(() => {
        const data: DraftData = {
            periodId: selectedPeriod,
            entries: manualEntries,
            savedAt: new Date().toLocaleString(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        setHasDraft(true);
        toast({ title: t('dataEntry.draftSaved') });
    }, [selectedPeriod, manualEntries, toast, t]);

    const clearDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setHasDraft(false);
        setManualEntries([]);
    };

    const addEntry = useCallback(() => {
        if (employees.length === 0 || assignments.length === 0) {
            toast({ variant: 'destructive', title: t('dataEntry.noEmployeesOrAssignments') });
            return;
        }
        const emp = employees[0];
        const assign = assignments[0];
        setManualEntries(prev => [...prev, {
            employeeId: emp.id,
            employeeName: emp.name,
            assignmentId: assign.id,
            kpiName: assign.kpiDefinition.name,
            targetValue: assign.targetValue,
            actualValue: '',
            remark: '',
        }]);
    }, [employees, assignments, toast, t]);

    const updateEntry = useCallback((index: number, field: keyof ManualEntry, value: string) => {
        setManualEntries(prev => {
            const updated = [...prev];
            if (field === 'employeeId') {
                const emp = employees.find(e => e.id === value);
                updated[index] = { ...updated[index], employeeId: value, employeeName: emp?.name || '' };
            } else if (field === 'assignmentId') {
                const assign = assignments.find(a => a.id === value);
                updated[index] = {
                    ...updated[index],
                    assignmentId: value,
                    kpiName: assign?.kpiDefinition.name || '',
                    targetValue: assign?.targetValue || 0,
                };
            } else {
                updated[index] = { ...updated[index], [field]: value };
            }
            return updated;
        });
    }, [employees, assignments]);

    const removeEntry = useCallback((index: number) => {
        setManualEntries(prev => prev.filter((_, i) => i !== index));
    }, []);

    const submitEntries = async () => {
        const validEntries = manualEntries.filter(e => e.actualValue !== '');
        if (validEntries.length === 0) {
            toast({ variant: 'destructive', title: t('dataEntry.noEmployeesOrAssignments') });
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

            toast({ title: t('dataEntry.submitSuccess'), description: t('dataEntry.submitSuccessDesc', { count: validEntries.length }) });
            clearDraft();
        } catch { toast({ variant: 'destructive', title: t('dataEntry.submitFailed') }); }
    };

    const handleDownload = async () => {
        if (!selectedPeriod) return;
        try {
            const blob = await assessmentApi.downloadTemplate(selectedPeriod);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `KPI_Template_${periods.find(p => p.id === selectedPeriod)?.name}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch { toast({ variant: 'destructive', title: t('common.loadFailed') }); }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedPeriod) return;
        setUploading(true);
        try {
            await assessmentApi.uploadData(selectedPeriod, file);
            toast({ title: t('dataEntry.submitSuccess') });
        } catch { toast({ variant: 'destructive', title: t('dataEntry.submitFailed') }); }
        finally { setUploading(false); e.target.value = ''; }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{t('dataEntry.title')}</h2>
                <p className="text-muted-foreground">{t('dataEntry.subtitle')}</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Label>{t('dataEntry.selectPeriod')}</Label>
                            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger className="w-[200px]"><SelectValue placeholder={t('dashboardView.selectPeriod')} /></SelectTrigger>
                                <SelectContent>
                                    {periods.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        {hasDraft && (
                            <Button variant="outline" size="sm" onClick={loadDraft}>
                                {t('dataEntry.loadDraft')}
                            </Button>
                        )}
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="excel" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="excel">{t('dataEntry.excelImport')}</TabsTrigger>
                    <TabsTrigger value="manual">{t('dataEntry.manualEntry')}</TabsTrigger>
                </TabsList>

                <TabsContent value="excel">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('dataEntry.downloadTemplate')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={handleDownload} disabled={!selectedPeriod} className="w-full">
                                    <Download className="mr-2 h-4 w-4" /> {t('dataEntry.downloadTemplate')}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('dataEntry.uploadFile')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Label htmlFor="excel-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                    {uploading ? (
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                            <span className="text-sm text-gray-500">.xlsx</span>
                                        </>
                                    )}
                                </Label>
                                <Input id="excel-upload" type="file" className="hidden" accept=".xlsx" onChange={handleUpload} disabled={uploading || !selectedPeriod} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="manual">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>{t('dataEntry.manualEntry')}</CardTitle>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={saveDraft} disabled={manualEntries.length === 0}>
                                        <Save className="mr-2 h-4 w-4" /> {t('dataEntry.saveDraft')}
                                    </Button>
                                    <Button size="sm" onClick={addEntry}>
                                        <Plus className="mr-2 h-4 w-4" /> {t('dataEntry.addEntry')}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('dataEntry.employee')}</TableHead>
                                        <TableHead>{t('dataEntry.kpi')}</TableHead>
                                        <TableHead>{t('assignment.targetValue')}</TableHead>
                                        <TableHead>{t('dataEntry.actualValue')}</TableHead>
                                        <TableHead>{t('dataEntry.remark')}</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {manualEntries.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('assignment.noData')}</TableCell></TableRow>
                                    ) : manualEntries.map((entry, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>
                                                <Select value={entry.employeeId} onValueChange={v => updateEntry(idx, 'employeeId', v)}>
                                                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {employees.map(e => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Select value={entry.assignmentId} onValueChange={v => updateEntry(idx, 'assignmentId', v)}>
                                                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {assignments.map(a => (<SelectItem key={a.id} value={a.id}>{a.kpiDefinition.name}</SelectItem>))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{entry.targetValue}</TableCell>
                                            <TableCell>
                                                <Input type="number" className="w-[100px]" value={entry.actualValue} onChange={e => updateEntry(idx, 'actualValue', e.target.value)} />
                                            </TableCell>
                                            <TableCell>
                                                <Input className="w-[120px]" value={entry.remark} onChange={e => updateEntry(idx, 'remark', e.target.value)} />
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm" onClick={() => removeEntry(idx)}>{t('delete')}</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {manualEntries.length > 0 && (
                                <div className="mt-4 flex justify-end">
                                    <Button onClick={submitEntries}>
                                        <Send className="mr-2 h-4 w-4" /> {t('dataEntry.submit')}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
});

DataEntryView.displayName = 'DataEntryView';
