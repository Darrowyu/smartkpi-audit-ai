import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = 'text-indigo-600',
  trend,
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-600">{title}</span>
        <div className={`p-2 rounded-lg bg-slate-50 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold text-slate-900">{value}</div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
};

