import React, { useEffect, useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Target, TrendingUp, TrendingDown, AlertTriangle, Medal, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { assessmentApi } from '@/api/assessment.api';
import { assignmentApi, KPIAssignmentDto } from '@/api/assignment.api';
import { reportsApi } from '@/api/reports.api';
import { AssessmentPeriod, PeriodStatus } from '@/types';

interface MyKPIProgress {
  name: string;
  target: number;
  actual: number;
  progress: number;
  score: number;
  weight: number;
}

export const MyDashboardView: React.FC = memo(() => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [myKPIs, setMyKPIs] = useState<MyKPIProgress[]>([]);
  const [summary, setSummary] = useState<{ score: number; rank: number; total: number; status: string } | null>(null);
  const [trendData, setTrendData] = useState<{ period: string; score: number }[]>([]);
  const [radarData, setRadarData] = useState<{ subject: string; score: number; fullMark: number }[]>([]);

  useEffect(() => { loadPeriods(); }, []);

  useEffect(() => {
    if (selectedPeriod) loadMyData();
  }, [selectedPeriod]);

  const loadPeriods = async () => {
    try {
      const response = await assessmentApi.getPeriods();
      const allPeriods = response.data || [];
      const validPeriods = allPeriods.filter((p: AssessmentPeriod) =>
        p.status === PeriodStatus.ACTIVE || p.status === PeriodStatus.LOCKED
      );
      setPeriods(validPeriods);
      if (validPeriods.length > 0) setSelectedPeriod(validPeriods[0].id);
    } catch {
      toast({ variant: 'destructive', title: t('common.loadFailed') });
    } finally {
      setLoading(false);
    }
  };

  const loadMyData = useCallback(async () => {
    if (!selectedPeriod || !user?.linkedEmployeeId) return;
    setLoading(true);
    try {
      const [assignments, employeeDetail, trend] = await Promise.all([
        assignmentApi.findByPeriod(selectedPeriod),
        reportsApi.getEmployeeDetail(selectedPeriod, user.linkedEmployeeId).catch(() => null),
        reportsApi.getTrend(6).catch(() => []),
      ]);

      const myAssignments = assignments.filter((a: KPIAssignmentDto) =>
        a.employeeId === user.linkedEmployeeId || (!a.employeeId && !a.departmentId)
      );

      const kpiProgress: MyKPIProgress[] = myAssignments.map((a: KPIAssignmentDto) => {
        const metric = employeeDetail?.metrics?.find(m => m.name === a.kpiDefinition.name);
        const actual = metric?.score ? (metric.score / 100) * a.targetValue : 0;
        return {
          name: a.kpiDefinition.name,
          target: a.targetValue,
          actual,
          progress: a.targetValue > 0 ? Math.min(100, (actual / a.targetValue) * 100) : 0,
          score: metric?.score || 0,
          weight: a.weight,
        };
      });
      setMyKPIs(kpiProgress);

      if (employeeDetail) {
        const totalScore = employeeDetail.totalScore || 0;
        const status = totalScore >= 90 ? 'excellent' : totalScore >= 80 ? 'good' : totalScore >= 60 ? 'average' : 'poor';
        setSummary({ score: totalScore, rank: 0, total: 0, status });

        const radar = employeeDetail.metrics?.slice(0, 6).map(m => ({
          subject: m.name.length > 6 ? m.name.slice(0, 6) + '...' : m.name,
          score: m.score,
          fullMark: 100,
        })) || [];
        setRadarData(radar);
      }

      const trendFormatted = trend.map((t: { period: string; avgScore: number }) => ({
        period: t.period,
        score: t.avgScore,
      }));
      setTrendData(trendFormatted);
    } catch {
      toast({ variant: 'destructive', title: t('common.loadFailed') });
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, user?.linkedEmployeeId, toast, t]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'average': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <Trophy className="h-5 w-5 text-green-600" />;
      case 'good': return <Medal className="h-5 w-5 text-blue-600" />;
      case 'average': return <Target className="h-5 w-5 text-yellow-600" />;
      case 'poor': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const completedKPIs = myKPIs.filter(k => k.progress >= 100).length;
  const avgProgress = myKPIs.length > 0 ? Math.round(myKPIs.reduce((sum, k) => sum + k.progress, 0) / myKPIs.length) : 0;

  if (loading && periods.length === 0) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('loading')}</div>;
  }

  if (!user?.linkedEmployeeId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('myDashboard.title')}</h2>
          <p className="text-muted-foreground">{t('myDashboard.subtitle')}</p>
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
          <h2 className="text-3xl font-bold tracking-tight">{t('myDashboard.title')}</h2>
          <p className="text-muted-foreground">{t('myDashboard.subtitle')}</p>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('myDashboard.myScore')}</CardTitle>
            {summary && getStatusIcon(summary.status)}
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${summary ? getStatusColor(summary.status) : ''}`}>
              {summary?.score || '-'}{t('dashboardView.avgScoreUnit')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.status === 'excellent' && t('myDashboard.statusExcellent')}
              {summary?.status === 'good' && t('myDashboard.statusGood')}
              {summary?.status === 'average' && t('myDashboard.statusAverage')}
              {summary?.status === 'poor' && t('myDashboard.statusPoor')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('myDashboard.kpiProgress')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgProgress}%</div>
            <Progress value={avgProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('myDashboard.completedKPIs')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedKPIs}/{myKPIs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('myDashboard.kpiItems')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('myDashboard.trend')}</CardTitle>
            {trendData.length >= 2 && trendData[trendData.length - 1]?.score >= trendData[trendData.length - 2]?.score
              ? <TrendingUp className="h-4 w-4 text-green-500" />
              : <TrendingDown className="h-4 w-4 text-red-500" />
            }
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {trendData.length >= 2
                ? `${trendData[trendData.length - 1]?.score > trendData[trendData.length - 2]?.score ? '+' : ''}${(trendData[trendData.length - 1]?.score - trendData[trendData.length - 2]?.score).toFixed(1)}`
                : '-'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('myDashboard.vsLastPeriod')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('myDashboard.myKPIProgress')}</CardTitle>
          <CardDescription>{t('myDashboard.myKPIProgressDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {myKPIs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t('myDashboard.noKPIsAssigned')}</div>
          ) : (
            <div className="space-y-4">
              {myKPIs.map((kpi, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{kpi.name}</span>
                    <span className="text-muted-foreground">
                      {kpi.progress.toFixed(0)}% ({t('myDashboard.target')}: {kpi.target})
                    </span>
                  </div>
                  <Progress value={kpi.progress} className={kpi.progress >= 100 ? '[&>div]:bg-green-500' : ''} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('myDashboard.performanceTrend')}</CardTitle>
            <CardDescription>{t('myDashboard.performanceTrendDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{t('charts.noTrendData')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => [`${value}${t('dashboardView.avgScoreUnit')}`, t('myDashboard.myScore')]} />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('myDashboard.abilityRadar')}</CardTitle>
            <CardDescription>{t('myDashboard.abilityRadarDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {radarData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{t('charts.noData')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar name={t('myDashboard.myScore')} dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

MyDashboardView.displayName = 'MyDashboardView';
