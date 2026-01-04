import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { assessmentApi } from '@/api/assessment.api';
import { reportsApi } from '@/api/reports.api';
import { notificationsApi, Notification as ApiNotification } from '@/api/notifications.api';
import { todosApi, Todo, BusinessTodo } from '@/api/todos.api';
import {
  WelcomeBanner,
  QuickNav,
  Notifications,
  TodoList,
  MonthlyPerformance,
  AddTodoDialog,
  type WelcomeStats,
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

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [manualTodos, setManualTodos] = useState<Todo[]>([]);
  const [businessTodos, setBusinessTodos] = useState<BusinessTodo[]>([]);
  const [addTodoOpen, setAddTodoOpen] = useState(false);

  const isManager = ['GROUP_ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(user?.role || '');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [notifRes, manualRes, businessRes, periodsRes] = await Promise.all([
        notificationsApi.getNotifications({ limit: 5 }).catch(() => ({ data: [], meta: { unreadCount: 0 } })),
        todosApi.getAll({ completed: false, limit: 10 }).catch(() => ({ data: [], meta: {} })),
        todosApi.getBusinessTodos().catch(() => []),
        assessmentApi.getPeriods().catch(() => ({ data: [] })),
      ]);

      setNotifications(notifRes.data || []);
      setManualTodos(manualRes.data || []);
      setBusinessTodos(businessRes || []);

      const periodsData = periodsRes.data || periodsRes || [];
      if (periodsData.length > 0) {
        const ov = await reportsApi.getOverview(periodsData[0].id).catch(() => null);
        setOverview(ov);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleTodo = async (id: string) => {
    try {
      await todosApi.toggle(id);
      setManualTodos((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // silent
    }
  };

  const handleViewAllNotifications = () => {
    const btn = document.querySelector('[data-notification-trigger]') as HTMLButtonElement;
    btn?.click();
  };

  const userName = user?.firstName || user?.username || '用户';

  const welcomeStats: WelcomeStats = useMemo(() => {
    const pendingCount = businessTodos.length + manualTodos.filter((t) => !t.completed).length;
    if (!overview) {
      return { completionRate: 0, pendingCount, teamMembers: 0, riskCount: 0 };
    }
    const total = overview.totalEmployees;
    const completed = overview.excellent + overview.good;
    return {
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      pendingCount,
      teamMembers: total,
      riskCount: overview.poor,
    };
  }, [overview, businessTodos, manualTodos]);

  const performanceMetrics: PerformanceMetric[] = useMemo(() => {
    if (!overview || overview.totalEmployees === 0) return [];
    const rate = Math.round(
      ((overview.excellent + overview.good) / overview.totalEmployees) * 100
    );
    return [{ id: '1', label: '目标达成率', value: rate, color: 'bg-brand-primary' }];
  }, [overview]);

  const ranking = useMemo(() => {
    if (!overview || overview.totalEmployees === 0) return undefined;
    const rate = Math.round(
      ((overview.excellent + overview.good) / overview.totalEmployees) * 100
    );
    if (rate >= 80) return { percentile: rate, message: `表现优秀！团队达成率${rate}%` };
    if (rate >= 60) return { percentile: rate, message: `表现良好，继续加油！` };
    return { percentile: rate, message: `需要关注，达成率${rate}%` };
  }, [overview]);

  const quickNavItems = useMemo(() => {
    type IconType = 'dashboard' | 'kpi' | 'team' | 'report';
    const items: { id: string; title: string; description: string; icon: IconType; path: string }[] = [
      { id: 'dashboard', title: '数据仪表盘', description: '查看详细的KPI数据分析和趋势图表', icon: 'dashboard', path: '/app/dashboard' },
      { id: 'kpi', title: 'KPI管理', description: '创建、编辑和跟踪您的关键绩效指标', icon: 'kpi', path: '/app/kpi-library' },
      { id: 'report', title: '报告中心', description: '生成和导出绩效报告文档', icon: 'report', path: '/app/reports' },
    ];
    if (isManager) {
      items.splice(2, 0, { id: 'team', title: '团队协作', description: '管理团队成员和分配绩效目标', icon: 'team', path: '/app/team' });
    }
    return items;
  }, [isManager]);

  return (
    <div className="space-y-6 pb-8">
      <WelcomeBanner
        userName={userName}
        stats={welcomeStats}
        onViewDashboard={() => navigate('/app/dashboard')}
      />

      <QuickNav items={quickNavItems} onNavigate={(path) => navigate(path)} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Notifications
            notifications={notifications}
            loading={loading}
            onViewAll={handleViewAllNotifications}
          />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <TodoList
            manualTodos={manualTodos}
            businessTodos={businessTodos}
            loading={loading}
            onAddTask={() => setAddTodoOpen(true)}
            onToggle={handleToggleTodo}
          />
          <MonthlyPerformance metrics={performanceMetrics} ranking={ranking} />
        </div>
      </div>

      <AddTodoDialog
        open={addTodoOpen}
        onOpenChange={setAddTodoOpen}
        onSuccess={loadData}
      />
    </div>
  );
};

export default LandingPage;
