import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Users, Calendar, RefreshCw, Calculator, Loader2 } from 'lucide-react';
import { assessmentApi } from '@/api/assessment.api';
import { reportsApi, DepartmentRanking, TrendData, EmployeeRanking } from '@/api/reports.api';
import { calculationApi } from '@/api/calculation.api';
import { usersApi, KpiPreferences } from '@/api/users.api';
import { AssessmentPeriod } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { useIsManager } from '@/hooks/usePermission';
import {
  StatsCards,
  TrendChart,
  TeamPerformance,
  KeyMetrics,
  RecentActivity,
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
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [deptRanking, setDeptRanking] = useState<DepartmentRanking[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [employeeRanking, setEmployeeRanking] = useState<EmployeeRanking[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [kpiPrefs, setKpiPrefs] = useState<KpiPreferences>(defaultPreferences);
  const { toast } = useToast();
  const isManager = useIsManager();

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
      const [ov, dept, emp] = await Promise.all([
        reportsApi.getOverview(id),
        reportsApi.getDepartmentRanking(id),
        reportsApi.getEmployeeRanking(id, 1, 10),
      ]);
      setOverview(ov);
      setDeptRanking(dept);
      setEmployeeRanking(emp.data || []);
    } catch (_e) { /* silent */ }
  };

  const handleExport = async () => {
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
    if (!overview) {
      return {
        totalKPIs: 24, completed: 18, inProgress: 4, atRisk: 2,
        trends: { totalKPIs: 12, completed: 8, inProgress: -2, atRisk: 1 },
        warningThreshold: kpiPrefs.warningThreshold,
      };
    }
    return {
      totalKPIs: overview.totalEmployees || 24,
      completed: overview.excellent + overview.good || 18,
      inProgress: overview.average || 4,
      atRisk: overview.poor || 2,
      trends: { totalKPIs: 12, completed: 8, inProgress: -2, atRisk: 1 },
      warningThreshold: kpiPrefs.warningThreshold,
    };
  }, [overview, kpiPrefs.warningThreshold]);

  const chartData: TrendDataPoint[] = useMemo(() => {
    if (trendData.length === 0) return [];
    return trendData.map((item, idx) => ({
      month: item.period || `${idx + 1}月`,
      actual: item.avgScore,
      target: 75
    }));
  }, [trendData]);

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

  // TODO: 后续从API获取真实的关键指标数据
  const keyMetrics: KeyMetric[] = useMemo(() => [], []);

  // TODO: 后续从API获取真实的活动记录
  const recentActivities: Activity[] = useMemo(() => [], []);

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* 头部区域 - 响应式 */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">绩效仪表盘</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">追踪和管理您的关键绩效指标</p>
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
              <Button className="flex-1 sm:flex-none bg-[#1E4B8E] hover:bg-[#163a6e] text-white">
                <Plus className="w-4 h-4 mr-1" /> <span className="hidden xs:inline">新建</span>KPI
              </Button>
              <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none">
                <FileText className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">生成报告</span>
              </Button>
              <Button variant="outline" className="flex-1 sm:flex-none">
                <Users className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">团队管理</span>
              </Button>
              <Button variant="outline" className="flex-1 sm:flex-none">
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
            <TrendChart data={chartData} />
          </div>
        )}
        <div className={kpiPrefs.showTrendChart ? 'xl:col-span-1' : 'xl:col-span-3'}>
          <TeamPerformance members={teamMembers} teamName="管理团队" showProgressBar={kpiPrefs.showProgressBar} />
        </div>
      </div>

      {/* 关键指标进度 + 最近动态 - 响应式网格 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2">
          <KeyMetrics metrics={keyMetrics} onViewAll={() => { }} />
        </div>
        <div className="xl:col-span-1">
          <RecentActivity activities={recentActivities} />
        </div>
      </div>
    </div>
  );
};
