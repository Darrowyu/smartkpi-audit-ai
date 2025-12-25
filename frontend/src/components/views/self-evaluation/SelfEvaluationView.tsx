import React, { useEffect, useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Save, CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { assessmentApi } from '@/api/assessment.api';
import { assignmentApi, KPIAssignmentDto } from '@/api/assignment.api';
import { apiClient } from '@/api/client';
import { AssessmentPeriod, PeriodStatus } from '@/types';

interface SelfEvalEntry {
  assignmentId: string;
  kpiCode: string;
  kpiName: string;
  unit?: string;
  targetValue: number;
  actualValue: string;
  remark: string;
}

interface SubmissionStatus {
  submitted: boolean;
  submittedAt?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

const DRAFT_KEY = 'self_eval_draft';

export const SelfEvaluationView: React.FC = memo(() => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<SelfEvalEntry[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadPeriods(); }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadAssignments().then(() => loadDraft());
      checkSubmissionStatus();
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
    } catch {
      toast({ variant: 'destructive', title: t('common.loadFailed') });
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = useCallback(async () => {
    if (!selectedPeriod || !user?.linkedEmployeeId) return;
    setLoading(true);
    try {
      const assignments = await assignmentApi.findByPeriod(selectedPeriod);
      const myAssignments = assignments.filter((a: KPIAssignmentDto) =>
        a.employeeId === user.linkedEmployeeId || (!a.employeeId && !a.departmentId)
      );

      const evalEntries: SelfEvalEntry[] = myAssignments.map((a: KPIAssignmentDto) => ({
        assignmentId: a.id,
        kpiCode: a.kpiDefinition.code,
        kpiName: a.kpiDefinition.name,
        unit: a.kpiDefinition.unit,
        targetValue: a.targetValue,
        actualValue: '',
        remark: '',
      }));
      setEntries(evalEntries);
    } catch {
      toast({ variant: 'destructive', title: t('common.loadFailed') });
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, user?.linkedEmployeeId, toast, t]);

  const checkSubmissionStatus = async () => {
    try {
      const res = await apiClient.get('/assessment/submissions/my-status', {
        params: { periodId: selectedPeriod },
      });
      setSubmissionStatus(res.data);
    } catch {
      setSubmissionStatus(null);
    }
  };

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem(`${DRAFT_KEY}_${selectedPeriod}`);
      if (draft) {
        const data = JSON.parse(draft);
        setEntries(prev => prev.map(e => {
          const saved = data.entries?.find((s: SelfEvalEntry) => s.assignmentId === e.assignmentId);
          return saved ? { ...e, actualValue: saved.actualValue, remark: saved.remark } : e;
        }));
      }
    } catch {
      localStorage.removeItem(`${DRAFT_KEY}_${selectedPeriod}`);
    }
  };

  const saveDraft = useCallback(() => {
    setSaving(true);
    try {
      localStorage.setItem(`${DRAFT_KEY}_${selectedPeriod}`, JSON.stringify({
        periodId: selectedPeriod,
        entries,
        savedAt: new Date().toISOString(),
      }));
      toast({ title: t('selfEvaluation.draftSaved') });
    } finally {
      setSaving(false);
    }
  }, [selectedPeriod, entries, toast, t]);

  const updateEntry = useCallback((assignmentId: string, field: 'actualValue' | 'remark', value: string) => {
    setEntries(prev => prev.map(e =>
      e.assignmentId === assignmentId ? { ...e, [field]: value } : e
    ));
  }, []);

  const handleSubmit = async () => {
    const validEntries = entries.filter(e => e.actualValue !== '');
    if (validEntries.length === 0) {
      toast({ variant: 'destructive', title: t('selfEvaluation.noDataToSubmit') });
      return;
    }

    setSubmitting(true);
    try {
      const submission = await apiClient.post('/assessment/submissions', {
        periodId: selectedPeriod,
        dataSource: 'self_evaluation',
        submittedBy: user?.id,
      });

      await apiClient.post('/assessment/entries/bulk', {
        submissionId: submission.data.id,
        entries: validEntries.map(e => ({
          assignmentId: e.assignmentId,
          employeeId: user?.linkedEmployeeId,
          actualValue: parseFloat(e.actualValue),
          remark: e.remark || undefined,
        })),
      });

      localStorage.removeItem(`${DRAFT_KEY}_${selectedPeriod}`);
      toast({ title: t('selfEvaluation.submitSuccess'), description: t('selfEvaluation.submitSuccessDesc') });
      checkSubmissionStatus();
    } catch {
      toast({ variant: 'destructive', title: t('selfEvaluation.submitFailed') });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />{t('selfEvaluation.approved')}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />{t('selfEvaluation.rejected')}</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />{t('selfEvaluation.pending')}</Badge>;
    }
  };

  const currentPeriod = periods.find(p => p.id === selectedPeriod);
  const canSubmit = currentPeriod?.status === PeriodStatus.ACTIVE && !submissionStatus?.submitted;

  if (loading && periods.length === 0) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('loading')}</div>;
  }

  if (!user?.linkedEmployeeId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{t('selfEvaluation.title')}</h2>
          <p className="text-muted-foreground">{t('selfEvaluation.subtitle')}</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-lg font-medium">{t('myDashboard.noLinkedEmployee')}</p>
              <p className="text-muted-foreground mt-2">{t('myDashboard.contactAdmin')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{t('selfEvaluation.title')}</h2>
          <p className="text-muted-foreground">{t('selfEvaluation.subtitle')}</p>
        </div>
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

      {submissionStatus?.submitted && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">{t('selfEvaluation.alreadySubmitted')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('selfEvaluation.submittedAt')}: {submissionStatus.submittedAt ? new Date(submissionStatus.submittedAt).toLocaleString() : '-'}
                  </p>
                </div>
              </div>
              {getStatusBadge(submissionStatus.status)}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('selfEvaluation.enterActualValues')}</CardTitle>
              <CardDescription>{t('selfEvaluation.enterActualValuesDesc')}</CardDescription>
            </div>
            {canSubmit && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={saveDraft} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {t('selfEvaluation.saveDraft')}
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  <Send className="w-4 h-4 mr-2" />
                  {t('selfEvaluation.submit')}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t('myDashboard.noKPIsAssigned')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('selfEvaluation.kpiName')}</TableHead>
                  <TableHead className="text-right">{t('selfEvaluation.targetValue')}</TableHead>
                  <TableHead className="text-right">{t('selfEvaluation.actualValue')}</TableHead>
                  <TableHead>{t('selfEvaluation.remark')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(entry => (
                  <TableRow key={entry.assignmentId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.kpiName}</div>
                        <div className="text-xs text-muted-foreground">{entry.kpiCode}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.targetValue}{entry.unit ? ` ${entry.unit}` : ''}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        className="w-[120px] ml-auto"
                        value={entry.actualValue}
                        onChange={e => updateEntry(entry.assignmentId, 'actualValue', e.target.value)}
                        disabled={!canSubmit}
                        placeholder={t('selfEvaluation.enterValue')}
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        className="min-h-[60px]"
                        value={entry.remark}
                        onChange={e => updateEntry(entry.assignmentId, 'remark', e.target.value)}
                        disabled={!canSubmit}
                        placeholder={t('selfEvaluation.addRemark')}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('selfEvaluation.tips')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• {t('selfEvaluation.tip1')}</li>
            <li>• {t('selfEvaluation.tip2')}</li>
            <li>• {t('selfEvaluation.tip3')}</li>
            <li>• {t('selfEvaluation.tip4')}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
});

SelfEvaluationView.displayName = 'SelfEvaluationView';
