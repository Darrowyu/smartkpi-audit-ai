import React from 'react';
import { Target, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface StatsData {
  totalKPIs: number;
  completed: number;
  inProgress: number;
  atRisk: number;
  trends: {
    totalKPIs: number;
    completed: number;
    inProgress: number;
    atRisk: number;
  };
  warningThreshold?: number;
}

interface StatsCardsProps {
  data: StatsData;
}

interface StatItemProps {
  title: string;
  value: number;
  trend: number;
  icon: React.ReactNode;
  iconBg: string;
}

const StatItem: React.FC<StatItemProps> = ({ title, value, trend, icon, iconBg }) => {
  const isPositive = trend >= 0;
  const isRiskCard = title.startsWith('有风险');
  const trendColor = isRiskCard 
    ? (trend > 0 ? 'text-red-500' : 'text-emerald-600')
    : (isPositive ? 'text-emerald-600' : 'text-red-500');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          <p className={`text-sm font-medium mt-1 ${trendColor}`}>
            {isPositive ? '+' : ''}{trend}% <span className="text-slate-400 font-normal">较上月</span>
          </p>
        </div>
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export const StatsCards: React.FC<StatsCardsProps> = ({ data }) => {
  const warningLabel = data.warningThreshold ? `有风险 (<${data.warningThreshold}%)` : '有风险';
  const stats = [
    {
      title: '总KPI数',
      value: data.totalKPIs,
      trend: data.trends.totalKPIs,
      icon: <Target className="w-6 h-6 text-brand-primary" />,
      iconBg: 'bg-primary/10',
    },
    {
      title: '已完成',
      value: data.completed,
      trend: data.trends.completed,
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
      iconBg: 'bg-emerald-50',
    },
    {
      title: '进行中',
      value: data.inProgress,
      trend: data.trends.inProgress,
      icon: <Clock className="w-6 h-6 text-slate-600" />,
      iconBg: 'bg-slate-100',
    },
    {
      title: warningLabel,
      value: data.atRisk,
      trend: data.trends.atRisk,
      icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
      iconBg: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatItem key={stat.title} {...stat} />
      ))}
    </div>
  );
};

export type { StatsData };
