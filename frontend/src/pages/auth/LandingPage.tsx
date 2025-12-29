import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { assessmentApi } from '@/api/assessment.api';
import { reportsApi } from '@/api/reports.api';
import {
  WelcomeBanner,
  QuickNav,
  Notifications,
  TodoList,
  MonthlyPerformance,
  type WelcomeStats,
  type Notification,
  type TodoItem,
  type PerformanceMetric,
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

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [overview, setOverview] = useState<OverviewData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await assessmentApi.getPeriods();
      const periodsData = response.data || response || [];
      if (periodsData.length > 0) {
        const ov = await reportsApi.getOverview(periodsData[0].id);
        setOverview(ov);
      }
    } catch (_e) { /* silent */ }
  };

  const userName = user?.firstName || user?.username || '用户';

  const welcomeStats: WelcomeStats = useMemo(() => {
    if (!overview) {
      return { completionRate: 87, activeKPIs: 24, teamMembers: 8, pendingTasks: 3 };
    }
    const total = overview.totalEmployees;
    const completed = overview.excellent + overview.good;
    return {
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 87,
      activeKPIs: overview.average || 24,
      teamMembers: total || 8,
      pendingTasks: overview.poor || 3,
    };
  }, [overview]);

  const notifications: Notification[] = useMemo(() => [
    { id: '1', type: 'success', title: '季度目标已达成', description: '销售团队Q1目标提前完成', time: '2小时前' },
    { id: '2', type: 'info', title: '月度评审即将开始', description: '请在12月28日前完成自评', time: '5小时前' },
    { id: '3', type: 'warning', title: '客户满意度需关注', description: '本月NPS评分低于目标值', time: '1天前' },
  ], []);

  const todos: TodoItem[] = useMemo(() => [
    { id: '1', title: '提交月度KPI报告', dueDate: '12月28日', priority: 'high' },
    { id: '2', title: '团队绩效评审会议', dueDate: '12月30日', priority: 'medium' },
    { id: '3', title: '年度目标规划', dueDate: '1月5日', priority: 'low' },
  ], []);

  const performanceMetrics: PerformanceMetric[] = useMemo(() => {
    const rate = overview ? Math.round(((overview.excellent + overview.good) / (overview.totalEmployees || 1)) * 100) : 87;
    return [
      { id: '1', label: '目标达成率', value: rate, color: 'bg-brand-primary' },
      { id: '2', label: '团队协作', value: 92, color: 'bg-emerald-500' },
      { id: '3', label: '任务完成', value: 78, color: 'bg-emerald-500' },
    ];
  }, [overview]);

  return (
    <div className="space-y-6 pb-8">
      {/* 欢迎横幅 */}
      <WelcomeBanner
        userName={userName}
        stats={welcomeStats}
        onViewDashboard={() => navigate('/app/dashboard')}
      />

      {/* 快速导航 */}
      <QuickNav onNavigate={(path) => navigate(path)} />

      {/* 通知 + 待办 + 本月表现 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Notifications notifications={notifications} onViewAll={() => {}} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <TodoList todos={todos} onAddTask={() => {}} />
          <MonthlyPerformance
            metrics={performanceMetrics}
            ranking={{ percentile: 85, message: '表现优秀！超过85%的团队成员' }}
          />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
