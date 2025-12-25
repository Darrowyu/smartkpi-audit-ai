import React, { useEffect, useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Info, Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { assessmentApi } from '@/api/assessment.api';
import { assignmentApi, KPIAssignmentDto } from '@/api/assignment.api';
import { reportsApi } from '@/api/reports.api';
import { AssessmentPeriod, PeriodStatus } from '@/types';

interface MyKPIDetail {
  id: string;
  code: string;
  name: string;
  unit?: string;
  formulaType: string;
  targetValue: number;
  challengeValue?: number;
  actualValue?: number;
  score: number;
  weight: number;
  weightedScore: number;
}

export const MyKPIsView: React.FC = memo(() => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [myKPIs, setMyKPIs] = useState<MyKPIDetail[]>([]);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [totalWeight, setTotalWeight] = useState<number>(0);

  useEffect(() => { loadPeriods(); }, []);

  useEffect(() => {
    if (selectedPeriod) loadMyKPIs();
  }, [selectedPeriod]);

  const loadPeriods = async () => {
    try {
      const response = await assessmentApi.getPeriods();
      const allPeriods = response.data || [];
      setPeriods(allPeriods);
      const activePeriod = allPeriods.find((p: AssessmentPeriod) => p.status === PeriodStatus.ACTIVE);
      if (activePeriod) setSelectedPeriod(activePeriod.id);
      else if (allPeriods.length > 0) setSelectedPeriod(allPeriods[0].id);
    } catch {
      toast({ variant: 'destructive', title: t('common.loadFailed') });
    } finally {
      setLoading(false);
    }
  };

  const loadMyKPIs = useCallback(async () => {
    if (!selectedPeriod || !user?.linkedEmployeeId) return;
    setLoading(true);
    try {
      const [assignments, employeeDetail] = await Promise.all([
        assignmentApi.findByPeriod(selectedPeriod),
        reportsApi.getEmployeeDetail(selectedPeriod, user.linkedEmployeeId).catch(() => null),
      ]);

      const myAssignments = assignments.filter((a: KPIAssignmentDto) =>
        a.employeeId === user.linkedEmployeeId || (!a.employeeId && !a.departmentId)
      );

      const kpis: MyKPIDetail[] = myAssignments.map((a: KPIAssignmentDto) => {
        const metric = employeeDetail?.metrics?.find(m => m.name === a.kpiDefinition.name);
        return {
          id: a.id,
          code: a.kpiDefinition.code,
          name: a.kpiDefinition.name,
          unit: a.kpiDefinition.unit,
          formulaType: a.kpiDefinition.formulaType,
          targetValue: a.targetValue,
          challengeValue: a.challengeValue,
          actualValue: undefined,
          score: metric?.score || 0,
          weight: a.weight,
          weightedScore: (metric?.score || 0) * (a.weight / 100),
        };
      });

      setMyKPIs(kpis);
      setTotalWeight(kpis.reduce((sum, k) => sum + k.weight, 0));
      setTotalScore(kpis.reduce((sum, k) => sum + k.weightedScore, 0));
    } catch {
      toast({ variant: 'destructive', title: t('common.loadFailed') });
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, user?.linkedEmployeeId, toast, t]);

  const getFormulaLabel = (type: string) => {
    switch (type) {
      case 'POSITIVE': return t('kpiLibrary.formulaHigherBetter');
      case 'NEGATIVE': return t('kpiLibrary.formulaLowerBetter');
      case 'BINARY': return t('kpiLibrary.formulaBoolean');
      case 'STEPPED': return t('kpiLibrary.formulaRange');
      case 'CUSTOM': return t('kpiLibrary.formulaCustom');
      default: return type;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-700">{t('statusExcellent')}</Badge>;
    if (score >= 80) return <Badge className="bg-blue-100 text-blue-700">{t('statusGood')}</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-700">{t('statusAverage')}</Badge>;
    return <Badge className="bg-red-100 text-red-700">{t('statusPoor')}</Badge>;
  };

  if (loading && periods.length === 0) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('myKPIs.title')}</h2>
          <p className="text-muted-foreground">{t('myKPIs.subtitle')}</p>
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('myKPIs.totalScore')}</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(totalScore)}`}>
              {totalScore.toFixed(1)}{t('dashboardView.avgScoreUnit')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('myKPIs.weightedTotal')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('myKPIs.kpiCount')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{myKPIs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('myKPIs.assignedToYou')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('myKPIs.weightSum')}</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totalWeight === 100 ? 'text-green-600' : 'text-yellow-600'}`}>
              {totalWeight}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('myKPIs.shouldBe100')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('myKPIs.detailList')}</CardTitle>
          <CardDescription>{t('myKPIs.detailListDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {myKPIs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t('myDashboard.noKPIsAssigned')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('myKPIs.kpiName')}</TableHead>
                  <TableHead>{t('myKPIs.formula')}</TableHead>
                  <TableHead className="text-right">{t('myKPIs.targetValue')}</TableHead>
                  <TableHead className="text-right">{t('myKPIs.weight')}</TableHead>
                  <TableHead className="text-right">{t('myKPIs.score')}</TableHead>
                  <TableHead className="text-right">{t('myKPIs.weightedScore')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myKPIs.map(kpi => (
                  <TableRow key={kpi.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{kpi.name}</div>
                        <div className="text-xs text-muted-foreground">{kpi.code}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline">{getFormulaLabel(kpi.formulaType)}</Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('myKPIs.formulaExplain')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-right">
                      {kpi.targetValue}{kpi.unit ? ` ${kpi.unit}` : ''}
                      {kpi.challengeValue && (
                        <div className="text-xs text-muted-foreground">
                          {t('myKPIs.challenge')}: {kpi.challengeValue}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{kpi.weight}%</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold ${getScoreColor(kpi.score)}`}>{kpi.score}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">{kpi.weightedScore.toFixed(1)}</span>
                    </TableCell>
                    <TableCell>{getScoreBadge(kpi.score)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={3}>{t('myKPIs.total')}</TableCell>
                  <TableCell className="text-right">{totalWeight}%</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-bold ${getScoreColor(totalScore)}`}>{totalScore.toFixed(1)}</span>
                  </TableCell>
                  <TableCell>{getScoreBadge(totalScore)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('myKPIs.scoreExplain')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">{t('myKPIs.formulaTypes')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>{t('kpiLibrary.formulaHigherBetter')}</strong>: {t('myKPIs.formulaHigherBetterDesc')}</li>
                <li>• <strong>{t('kpiLibrary.formulaLowerBetter')}</strong>: {t('myKPIs.formulaLowerBetterDesc')}</li>
                <li>• <strong>{t('kpiLibrary.formulaBoolean')}</strong>: {t('myKPIs.formulaBooleanDesc')}</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">{t('myKPIs.scoreRanges')}</h4>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2"><Badge className="bg-green-100 text-green-700">{t('statusExcellent')}</Badge> 90-100{t('dashboardView.avgScoreUnit')}</li>
                <li className="flex items-center gap-2"><Badge className="bg-blue-100 text-blue-700">{t('statusGood')}</Badge> 80-89{t('dashboardView.avgScoreUnit')}</li>
                <li className="flex items-center gap-2"><Badge className="bg-yellow-100 text-yellow-700">{t('statusAverage')}</Badge> 60-79{t('dashboardView.avgScoreUnit')}</li>
                <li className="flex items-center gap-2"><Badge className="bg-red-100 text-red-700">{t('statusPoor')}</Badge> &lt;60{t('dashboardView.avgScoreUnit')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

MyKPIsView.displayName = 'MyKPIsView';
