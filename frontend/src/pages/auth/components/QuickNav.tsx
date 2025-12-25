import React from 'react';
import { LayoutDashboard, Target, Users, FileText } from 'lucide-react';

interface NavItem {
  id: string;
  title: string;
  description: string;
  icon: 'dashboard' | 'kpi' | 'team' | 'report';
  path: string;
}

interface QuickNavProps {
  items?: NavItem[];
  onNavigate?: (path: string) => void;
}

const iconMap = {
  dashboard: { icon: LayoutDashboard, bg: 'bg-slate-800', color: 'text-white' },
  kpi: { icon: Target, bg: 'bg-emerald-100', color: 'text-emerald-600' },
  team: { icon: Users, bg: 'bg-amber-100', color: 'text-amber-600' },
  report: { icon: FileText, bg: 'bg-slate-100', color: 'text-slate-600' },
};

const defaultItems: NavItem[] = [
  { id: 'dashboard', title: '数据仪表盘', description: '查看详细的KPI数据分析和趋势图表', icon: 'dashboard', path: '/dashboard' },
  { id: 'kpi', title: 'KPI管理', description: '创建、编辑和跟踪您的关键绩效指标', icon: 'kpi', path: '/kpi-library' },
  { id: 'team', title: '团队协作', description: '管理团队成员和分配绩效目标', icon: 'team', path: '/team' },
  { id: 'report', title: '报告中心', description: '生成和导出绩效报告文档', icon: 'report', path: '/reports' },
];

export const QuickNav: React.FC<QuickNavProps> = ({ items = defaultItems, onNavigate }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">快速导航</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => {
          const { icon: Icon, bg, color } = iconMap[item.icon];
          return (
            <div
              key={item.id}
              onClick={() => onNavigate?.(item.path)}
              className="bg-white rounded-xl border border-slate-200 p-5 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all group"
            >
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2">{item.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export type { NavItem };
