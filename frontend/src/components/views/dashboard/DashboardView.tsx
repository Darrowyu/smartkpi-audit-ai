import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ArrowUpRight, Users, Trophy, AlertTriangle, Download, Calculator, RefreshCw, User } from 'lucide-react';
import { assessmentApi } from '@/api/assessment.api';
import { reportsApi, DepartmentRanking, TrendData } from '@/api/reports.api';
import { calculationApi } from '@/api/calculation.api';
import { AssessmentPeriod } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { useIsManager } from '@/hooks/usePermission';
import { useAuth } from '@/context/AuthContext';

interface OverviewData {
  periodName: string;
  totalEmployees: number;
  avgScore: number;
  excellent: number;
  good: number;
  average: number;
  poor: number;
}

interface DashboardViewProps {
  language?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = () => {
  const { t } = useTranslation();
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [deptRanking, setDeptRanking] = useState<DepartmentRanking[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();
  const isManager = useIsManager(); // 检查是否为经理或更高角色
  const { user } = useAuth();

  useEffect(() => {
    loadPeriods();
    loadTrend();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadPeriodData(selectedPeriod);
    }
  }, [selectedPeriod]);

  const loadPeriods = async () => {
    try {
      const response = await assessmentApi.getPeriods();
      const periodsData = response.data || response || [];
      setPeriods(periodsData);
      if (periodsData.length > 0) {
        setSelectedPeriod(periodsData[0].id);
      }
    } catch (_e) {
      // silent fail
    }
  };

  const loadTrend = async () => {
    try {
      const data = await reportsApi.getTrend();
      setTrendData(data);
    } catch (_e) {
      // silent fail
    }
  };

  const loadPeriodData = async (id: string) => {
    try {
      const [ov, dept] = await Promise.all([
        reportsApi.getOverview(id),
        reportsApi.getDepartmentRanking(id),
      ]);
      setOverview(ov);
      setDeptRanking(dept);
    } catch (_e) {
      // silent fail
    }
  };

  const handleExport = async () => {
    if (!selectedPeriod) return;
    try {
      const blob = await reportsApi.exportEmployees(selectedPeriod, 'xlsx');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Performance_Report_${overview?.periodName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (_e) {
      toast({ variant: 'destructive', title: t('dashboardView.exportFailed'), description: t('dashboardView.exportFailedDesc') });
    }
  };

  const handleCalculate = async () => {
    if (!selectedPeriod) return;
    setIsCalculating(true);
    try {
      const result = await calculationApi.executeCalculation(selectedPeriod);
      toast({ title: t('dashboardView.calculationDone'), description: t('dashboardView.calculationDoneDesc', { count: result.employeeCount, time: result.totalTime }) });
      await loadPeriodData(selectedPeriod);
      await loadTrend();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast({ variant: 'destructive', title: t('dashboardView.calculationFailed'), description: err.response?.data?.message || t('dashboardView.calculationFailedDesc') });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleRefresh = async () => {
    if (selectedPeriod) {
      await loadPeriodData(selectedPeriod);
      await loadTrend();
      toast({ title: t('dashboardView.refreshed'), description: t('dashboardView.refreshedDesc') });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isManager ? t('dashboardView.title') : t('dashboardView.myPerformance', '我的绩效')}
          </h2>
          <p className="text-muted-foreground">
            {isManager ? t('dashboardView.subtitle') : t('dashboardView.myPerformanceDesc', '查看您的个人绩效数据')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('dashboardView.selectPeriod')} />
            </SelectTrigger>
            <SelectContent>
              {periods.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" /> {t('dashboardView.refresh')}
          </Button>
          {isManager && ( // 仅经理及以上角色显示计算和导出按钮
            <>
              <Button variant="outline" onClick={handleCalculate} disabled={isCalculating}>
                <Calculator className="mr-2 h-4 w-4" /> {isCalculating ? t('dashboardView.calculating') : t('dashboardView.recalculate')}
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> {t('dashboardView.exportReport')}
              </Button>
            </>
          )}
        </div>
      </div>

      {overview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboardView.totalParticipants')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalEmployees}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboardView.avgScore')}</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.avgScore}{t('dashboardView.avgScoreUnit')}</div>
              <p className="text-xs text-muted-foreground">
                {overview.avgScore >= 80 ? t('dashboardView.performanceExcellent') : t('dashboardView.performanceNormal')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboardView.excellentRate')}</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview.totalEmployees > 0
                  ? Math.round((overview.excellent / overview.totalEmployees) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">{t('dashboardView.peopleExcellent', { count: overview.excellent })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboardView.needsImprovement')}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview.totalEmployees > 0
                  ? Math.round((overview.poor / overview.totalEmployees) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">{t('dashboardView.peopleNeedImprovement', { count: overview.poor })}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>{t('dashboardView.deptRanking')}</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={deptRanking}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="departmentName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#8884d8" name={t('dashboardView.avgScoreLabel')} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{t('dashboardView.trendAnalysis')}</CardTitle>
            <CardDescription>{t('dashboardView.trendDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="avgScore" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
