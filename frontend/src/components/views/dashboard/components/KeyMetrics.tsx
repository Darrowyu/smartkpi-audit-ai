import React from 'react';

interface KeyMetric {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  status: 'normal' | 'warning' | 'danger' | 'late';
  deadline?: string;
}

interface KeyMetricsProps {
  metrics: KeyMetric[];
  onViewAll?: () => void;
}

const getStatusConfig = (status: KeyMetric['status']) => {
  switch (status) {
    case 'normal':
      return { label: '正常', color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' };
    case 'warning':
      return { label: '有风险', color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-500' };
    case 'danger':
      return { label: '严重', color: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-500' };
    case 'late':
      return { label: '滞后', color: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-500' };
    default:
      return { label: '正常', color: 'text-slate-600', bg: 'bg-slate-50', bar: 'bg-slate-500' };
  }
};

const formatValue = (value: number, unit: string): string => {
  if (unit === '¥' || unit === '元') {
    if (value >= 10000) {
      return `${(value / 10000).toLocaleString()}万¥`;
    }
    return `${value.toLocaleString()}¥`;
  }
  return `${value}${unit}`;
};

const formatTarget = (value: number, unit: string): string => {
  if (unit === '¥' || unit === '元') {
    if (value >= 10000) {
      return `${(value / 10000).toLocaleString()}万¥`;
    }
    return `${value.toLocaleString()}¥`;
  }
  return `${value}${unit}`;
};

export const KeyMetrics: React.FC<KeyMetricsProps> = ({ metrics, onViewAll }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">关键指标进度</h3>
        {onViewAll && (
          <button onClick={onViewAll} className="text-sm text-brand-primary hover:text-brand-dark font-medium">
            查看全部
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric) => {
          const progress = Math.min((metric.currentValue / metric.targetValue) * 100, 100);
          const statusConfig = getStatusConfig(metric.status);
          const gap = Math.max(0, metric.targetValue - metric.currentValue);
          
          return (
            <div key={metric.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">{metric.name}</h4>
                  {metric.deadline && (
                    <p className="text-xs text-slate-400 mt-0.5">截止: {metric.deadline}</p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-md ${statusConfig.color} ${statusConfig.bg}`}>
                  {statusConfig.label}
                </span>
              </div>
              <div className="mb-3">
                <span className="text-2xl font-bold text-slate-900">
                  {formatValue(metric.currentValue, metric.unit)}
                </span>
                <span className="text-sm text-slate-400 ml-2">
                  / {formatTarget(metric.targetValue, metric.unit)}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${statusConfig.bar} rounded-full transition-all duration-300`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>完成度: {progress.toFixed(1)}%</span>
                  <span>差距: {formatValue(gap, metric.unit)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export type { KeyMetric };
