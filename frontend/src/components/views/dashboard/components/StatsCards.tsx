import React from 'react';
import { Users, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

interface StatsData {
  totalEmployees: number;
  passedEmployees: number;
  needImprovement: number;
  atRisk: number;
  trends: {
    totalEmployees: number;
    passedEmployees: number;
    needImprovement: number;
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
  const isNegativeGood = title === '待提升' || title.startsWith('绩效预警');
  const trendColor = isNegativeGood 
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
  const warningLabel = data.warningThreshold ? `绩效预警 (<${data.warningThreshold}分)` : '绩效预警';
  const stats = [
    {
      title: '参评员工',
      value: data.totalEmployees,
      trend: data.trends.totalEmployees,
      icon: <Users className="w-6 h-6 text-brand-primary" />,
      iconBg: 'bg-primary/10',
    },
    {
      title: '达标员工',
      value: data.passedEmployees,
      trend: data.trends.passedEmployees,
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
      iconBg: 'bg-emerald-50',
    },
    {
      title: '待提升',
      value: data.needImprovement,
      trend: data.trends.needImprovement,
      icon: <TrendingUp className="w-6 h-6 text-amber-600" />,
      iconBg: 'bg-amber-50',
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
