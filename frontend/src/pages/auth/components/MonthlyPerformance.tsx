import React from 'react';
import { Award } from 'lucide-react';

interface PerformanceMetric {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface MonthlyPerformanceProps {
  metrics: PerformanceMetric[];
  ranking?: { percentile: number; message: string };
}

const defaultMetrics: PerformanceMetric[] = [
  { id: '1', label: '目标达成率', value: 87, color: 'bg-brand-primary' },
  { id: '2', label: '团队协作', value: 92, color: 'bg-emerald-500' },
  { id: '3', label: '任务完成', value: 78, color: 'bg-emerald-500' },
];

export const MonthlyPerformance: React.FC<MonthlyPerformanceProps> = ({ 
  metrics = defaultMetrics,
  ranking = { percentile: 85, message: '表现优秀！超过85%的团队成员' }
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Award className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-slate-800">本月表现</h3>
      </div>
      <div className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.id}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-slate-600">{metric.label}</span>
              <span className="text-sm font-semibold text-slate-900">{metric.value}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${metric.color} rounded-full transition-all duration-500`}
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {ranking && (
        <div className="mt-5 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
          <p className="text-sm text-emerald-700 font-medium flex items-center gap-2">
            <span className="text-lg">🎉</span>
            {ranking.message}
          </p>
        </div>
      )}
    </div>
  );
};

export type { PerformanceMetric };
