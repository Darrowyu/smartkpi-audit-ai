import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Users, Calendar, RefreshCw, Calculator, Loader2 } from 'lucide-react';
import { assessmentApi } from '@/api/assessment.api';
import { reportsApi, DepartmentRanking as DeptRankingType, TrendData, EmployeeRanking } from '@/api/reports.api';
import { calculationApi } from '@/api/calculation.api';
import { usersApi, KpiPreferences } from '@/api/users.api';
import { myApi, MyKPIItem } from '@/api/my.api';
import { AssessmentPeriod } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { useIsManager, usePermission } from '@/hooks/usePermission';
import {
  StatsCards,
  TrendChart,
  TeamPerformance,
  KeyMetrics,
  RecentActivity,
  DepartmentRanking,
  type StatsData,
  type TrendDataPoint,
  type TeamMember,
  type KeyMetric,
  type Activity
} from './components';

interface OverviewData {
  periodName: string;
  totalEmployees: number;
  avgScore: number;
  excellent: number;
  good: number;
  average: number;
  poor: number;
}

const defaultPreferences: KpiPreferences = {
  defaultView: 'month',
  reminderFrequency: 'weekly',
  showProgressBar: true,
  showTrendChart: true,
  autoCalculate: true,
  warningThreshold: 80,
  selectedQuarter: 'Q1',
};

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [prevOverview, setPrevOverview] = useState<OverviewData | null>(null);
  const [deptRanking, setDeptRanking] = useState<DeptRankingType[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [employeeRanking, setEmployeeRanking] = useState<EmployeeRanking[]>([]);
  const [myKpis, setMyKpis] = useState<MyKPIItem[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [kpiPrefs, setKpiPrefs] = useState<KpiPreferences>(defaultPreferences);
  const { toast } = useToast();
  const isManager = useIsManager();
  const canExport = usePermission('report:export');

  useEffect(() => {
    loadPeriods();
    loadTrend();
    usersApi.getKpiPreferences().then(setKpiPrefs).catch(() => {});
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
        if (periodsData.length > 1) {
          const prevOv = await reportsApi.getOverview(periodsData[1].id).catch(() => null);
          setPrevOverview(prevOv);
        }
      }
    } catch (_e) { /* silent */ }
  };

  const loadTrend = async () => {
    try {
      const data = await reportsApi.getTrend(8);
      setTrendData(data);
    } catch (_e) { /* silent */ }
  };

  const loadPeriodData = async (id: string) => {
    try {
      if (isManager) {
        const [ov, dept, emp] = await Promise.all([
          reportsApi.getOverview(id),
          reportsApi.getDepartmentRanking(id),
          reportsApi.getEmployeeRanking(id, 1, 10),
        ]);
        setOverview(ov);
        setDeptRanking(dept);
        setEmployeeRanking(emp.data || []);
      } else {
        const kpis = await myApi.getMyKPIs(id).catch(() => []);
        setMyKpis(kpis);
      }
    } catch (_e) { /* silent */ }
  };

  const handleExport = async () => {
    if (!canExport) {
      toast({ variant: 'destructive', title: '无导出权限' });
      return;
    }
    if (!selectedPeriod) return;
    try {
      const blob = await reportsApi.exportEmployees(selectedPeriod, 'xlsx');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `绩效报告_${overview?.periodName || selectedPeriod}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (_e) {
      toast({ variant: 'destructive', title: '导出失败', description: '请稍后重试' });
    }
  };

  const handleRefresh = async () => {
    if (selectedPeriod) {
      await loadPeriodData(selectedPeriod);
      await loadTrend();
      toast({ title: '已刷新', description: '数据已更新' });
    }
  };

  const handleCalculate = useCallback(async () => {
    if (!selectedPeriod) return;
    setIsCalculating(true);
    try {
      const result = await calculationApi.executeCalculation(selectedPeriod);
      toast({
        title: '计算完成',
        description: `已计算 ${result.employeeCount} 名员工、${result.departmentCount} 个部门的绩效`,
      });
      await loadPeriodData(selectedPeriod);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: '计算失败',
        description: e.response?.data?.message || '请确保有已审批的数据提交',
      });
    } finally {
      setIsCalculating(false);
    }
  }, [selectedPeriod, toast]);

  const statsData: StatsData = useMemo(() => {
    const calcTrend = (curr: number, prev: number): number => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    if (!overview) {
      return {
        totalEmployees: 0, passedEmployees: 0, needImprovement: 0, atRisk: 0,
        trends: { totalEmployees: 0, passedEmployees: 0, needImprovement: 0, atRisk: 0 },
        warningThreshold: kpiPrefs.warningThreshold,
      };
    }

    const curr = {
      totalEmployees: overview.totalEmployees,
      passedEmployees: overview.excellent + overview.good,
      needImprovement: overview.average,
      atRisk: overview.poor,
    };

    const prev = prevOverview ? {
      totalEmployees: prevOverview.totalEmployees,
      passedEmployees: prevOverview.excellent + prevOverview.good,
      needImprovement: prevOverview.average,
      atRisk: prevOverview.poor,
    } : { totalEmployees: 0, passedEmployees: 0, needImprovement: 0, atRisk: 0 };

    return {
      ...curr,
      trends: {
        totalEmployees: calcTrend(curr.totalEmployees, prev.totalEmployees),
        passedEmployees: calcTrend(curr.passedEmployees, prev.passedEmployees),
        needImprovement: calcTrend(curr.needImprovement, prev.needImprovement),
        atRisk: calcTrend(curr.atRisk, prev.atRisk),
      },
      warningThreshold: kpiPrefs.warningThreshold,
    };
  }, [overview, prevOverview, kpiPrefs.warningThreshold]);

  const targetScore = useMemo(() => {
    return kpiPrefs.warningThreshold || 70;
  }, [kpiPrefs.warningThreshold]);

  const chartData: TrendDataPoint[] = useMemo(() => {
    if (trendData.length === 0) return [];
    return trendData.map((item, idx) => ({
      month: item.period || `${idx + 1}月`,
      actual: item.avgScore,
      target: targetScore
    }));
  }, [trendData, targetScore]);

  const teamMembers: TeamMember[] = useMemo(() => {
    if (employeeRanking.length === 0) return [];
    return employeeRanking.slice(0, 4).map((emp, idx) => ({
      id: emp.employeeId || `emp-${idx}`,
      name: emp.employeeName,
      role: emp.departmentName,
      progress: Math.round(emp.score),
      completed: Math.round(emp.score / 10),
      total: 10
    }));
  }, [employeeRanking]);

  const selectedPeriodData = useMemo(() => {
    return periods.find(p => p.id === selectedPeriod);
  }, [periods, selectedPeriod]);

  const keyMetrics: KeyMetric[] = useMemo(() => {
    const getStatus = (progress: number): 'normal' | 'warning' | 'danger' => {
      if (progress >= 80) return 'normal';
      if (progress >= 60) return 'warning';
      return 'danger';
    };

    if (isManager) {
      if (deptRanking.length === 0) return [];
      return deptRanking.slice(0, 4).map((dept) => ({
        id: dept.departmentId,
        name: dept.departmentName,
        currentValue: Math.round(dept.score),
        targetValue: 100,
        unit: '分',
        status: getStatus(dept.score),
        deadline: selectedPeriodData?.endDate ? new Date(selectedPeriodData.endDate).toLocaleDateString('zh-CN') : undefined,
      }));
    } else {
      if (myKpis.length === 0) return [];
      return myKpis.slice(0, 4).map((kpi) => {
        const progress = kpi.targetValue > 0 ? ((kpi.actualValue || 0) / kpi.targetValue) * 100 : 0;
        return {
          id: kpi.assignmentId,
          name: kpi.kpiName,
          currentValue: kpi.actualValue || 0,
          targetValue: kpi.targetValue,
          unit: kpi.unit || '',
          status: getStatus(progress),
          deadline: selectedPeriodData?.endDate ? new Date(selectedPeriodData.endDate).toLocaleDateString('zh-CN') : undefined,
        };
      });
    }
  }, [isManager, deptRanking, myKpis, selectedPeriodData]);

  const recentActivities: Activity[] = useMemo(() => {
    const activities: Activity[] = [];

    if (overview && overview.poor > 0) {
      activities.push({
        id: 'alert-poor',
        type: 'alert',
        title: '绩效预警',
        description: `本周期有 ${overview.poor} 名员工需要关注`,
        time: '本周期',
      });
    }

    deptRanking.slice(0, 3).forEach((dept) => {
      activities.push({
        id: `dept-${dept.departmentId}`,
        type: 'milestone',
        title: `${dept.departmentName} 排名第${dept.rank}`,
        description: `得分 ${dept.score.toFixed(1)}，共 ${dept.employeeCount} 人`,
        time: '本周期',
      });
    });

    employeeRanking.slice(0, 2).forEach((emp) => {
      activities.push({
        id: `emp-${emp.employeeId}`,
        type: 'complete',
        title: `${emp.employeeName} 表现优秀`,
        description: `${emp.departmentName}，得分 ${emp.score.toFixed(1)}`,
        time: '本周期',
      });
    });

    if (overview) {
      activities.push({
        id: 'calc-done',
        type: 'update',
        title: '绩效计算已完成',
        description: `周期: ${overview.periodName}`,
        time: '本周期',
      });
    }

    return activities.slice(0, 6);
  }, [overview, deptRanking, employeeRanking]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* 头部区域 - 响应式 */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {isManager ? '绩效仪表盘' : '我的绩效'}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            {isManager ? '追踪和管理团队关键绩效指标' : '查看和跟踪您的个人KPI完成情况'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-[140px] bg-white">
              <Calendar className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="选择周期" />
            </SelectTrigger>
            <SelectContent>
              {periods.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isManager && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={handleCalculate}
                disabled={isCalculating || !selectedPeriod}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isCalculating ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Calculator className="w-4 h-4 mr-1" />
                )}
                <span className="hidden xs:inline">{isCalculating ? '计算中...' : '计算绩效'}</span>
              </Button>
              <Button onClick={() => navigate('/app/kpi-library')} className="flex-1 sm:flex-none bg-brand-primary hover:opacity-90 text-brand-text">
                <Plus className="w-4 h-4 mr-1" /> <span className="hidden xs:inline">新建</span>KPI
              </Button>
              <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none" disabled={!canExport}>
                <FileText className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">生成报告</span>
              </Button>
              <Button variant="outline" onClick={() => navigate('/app/team')} className="flex-1 sm:flex-none">
                <Users className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">团队管理</span>
              </Button>
              <Button variant="outline" onClick={() => navigate('/app/assessment')} className="flex-1 sm:flex-none">
                <Calendar className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">设定周期</span>
              </Button>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={handleRefresh} className="ml-auto sm:ml-0" aria-label="刷新数据">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <StatsCards data={statsData} />

      {/* 趋势图 + 团队表现 - 响应式网格 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {kpiPrefs.showTrendChart && (
          <div className="xl:col-span-2">
            <TrendChart data={chartData} targetScore={targetScore} />
          </div>
        )}
        <div className={kpiPrefs.showTrendChart ? 'xl:col-span-1' : 'xl:col-span-3'}>
          <TeamPerformance members={teamMembers} teamName="绩效排行" showProgressBar={kpiPrefs.showProgressBar} />
        </div>
      </div>

      {/* 关键指标进度 + 最近动态 - 响应式网格 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2">
          <KeyMetrics 
            metrics={keyMetrics} 
            title={isManager ? '部门绩效概览' : '我的KPI进度'} 
          />
        </div>
        <div className="xl:col-span-1">
          <RecentActivity activities={recentActivities} />
        </div>
      </div>

      {/* 部门排名 - 仅管理者可见 */}
      {isManager && <DepartmentRanking departments={deptRanking} />}
    </div>
  );
};
