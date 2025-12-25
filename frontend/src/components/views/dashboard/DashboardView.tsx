import React, { useEffect, useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Users, Calendar, RefreshCw } from 'lucide-react';
import { assessmentApi } from '@/api/assessment.api';
import { reportsApi, DepartmentRanking, TrendData, EmployeeRanking } from '@/api/reports.api';
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

export const DashboardView: React.FC = () => {
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [deptRanking, setDeptRanking] = useState<DepartmentRanking[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [employeeRanking, setEmployeeRanking] = useState<EmployeeRanking[]>([]);
  const { toast } = useToast();
  const isManager = useIsManager();

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

  const statsData: StatsData = useMemo(() => {
    if (!overview) {
      return {
        totalKPIs: 24, completed: 18, inProgress: 4, atRisk: 2,
        trends: { totalKPIs: 12, completed: 8, inProgress: -2, atRisk: 1 }
      };
    }
    return {
      totalKPIs: overview.totalEmployees || 24,
      completed: overview.excellent + overview.good || 18,
      inProgress: overview.average || 4,
      atRisk: overview.poor || 2,
      trends: { totalKPIs: 12, completed: 8, inProgress: -2, atRisk: 1 }
    };
  }, [overview]);

  const chartData: TrendDataPoint[] = useMemo(() => {
    if (trendData.length === 0) {
      return ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月'].map((month, i) => ({
        month, actual: 50 + i * 5 + Math.floor(Math.random() * 10), target: 75
      }));
    }
    return trendData.map((item, idx) => ({
      month: item.period || `${idx + 1}月`,
      actual: item.avgScore,
      target: 75
    }));
  }, [trendData]);

  const teamMembers: TeamMember[] = useMemo(() => {
    if (employeeRanking.length === 0) {
      return [
        { id: '1', name: '张明', role: '产品经理', progress: 92, completed: 11, total: 12 },
        { id: '2', name: '李华', role: '开发工程师', progress: 78, completed: 7, total: 9 },
        { id: '3', name: '王芳', role: '设计师', progress: 85, completed: 17, total: 20 },
        { id: '4', name: '刘强', role: '运营经理', progress: 65, completed: 13, total: 20 },
      ];
    }
    return employeeRanking.slice(0, 4).map((emp, idx) => ({
      id: emp.employeeId || `emp-${idx}`,
      name: emp.employeeName,
      role: emp.departmentName,
      progress: Math.round(emp.score),
      completed: Math.round(emp.score / 10),
      total: 10
    }));
  }, [employeeRanking]);

  const keyMetrics: KeyMetric[] = useMemo(() => [
    { id: '1', name: '季度销售额', currentValue: 850000, targetValue: 1000000, unit: '¥', status: 'normal' as const, deadline: '2024-03-31' },
    { id: '2', name: '客户满意度', currentValue: 4.2, targetValue: 4.5, unit: '分', status: 'warning' as const, deadline: '2024-03-31' },
    { id: '3', name: '新客户获取', currentValue: 45, targetValue: 80, unit: '个', status: 'late' as const, deadline: '2024-03-31' },
    { id: '4', name: '产品上线数', currentValue: 3, targetValue: 4, unit: '个', status: 'normal' as const, deadline: '2024-03-31' },
  ], []);

  const recentActivities: Activity[] = useMemo(() => [
    { id: '1', type: 'complete', title: '完成季度报告', description: 'Q4销售分析报告已提交', time: '10分钟前' },
    { id: '2', type: 'alert', title: 'KPI预警', description: '客户满意度指标接近风险线', time: '1小时前' },
    { id: '3', type: 'milestone', title: '达成里程碑', description: '新客户获取超过40个', time: '2小时前' },
    { id: '4', type: 'team', title: '团队更新', description: '王芳完成了设计任务', time: '3小时前' },
    { id: '5', type: 'kpi', title: 'KPI调整', description: '产品上线目标已更新', time: '5小时前' },
  ], []);

  return (
    <div className="space-y-6 pb-8">
      {/* 头部区域 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">绩效仪表盘</h1>
          <p className="text-slate-500 mt-1">追踪和管理您的关键绩效指标</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px] bg-white">
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
            <>
              <Button className="bg-[#1E4B8E] hover:bg-[#163a6e] text-white">
                <Plus className="w-4 h-4 mr-1" /> 新建KPI
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <FileText className="w-4 h-4 mr-1" /> 生成报告
              </Button>
              <Button variant="outline">
                <Users className="w-4 h-4 mr-1" /> 团队管理
              </Button>
              <Button variant="outline">
                <Calendar className="w-4 h-4 mr-1" /> 设定周期
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <StatsCards data={statsData} />

      {/* 趋势图 + 团队表现 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart data={chartData} />
        </div>
        <div className="lg:col-span-1">
          <TeamPerformance members={teamMembers} teamName="管理团队" />
        </div>
      </div>

      {/* 关键指标进度 + 最近动态 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <KeyMetrics metrics={keyMetrics} onViewAll={() => {}} />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity activities={recentActivities} />
        </div>
      </div>
    </div>
  );
};
