import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface TrendDataPoint {
  month: string;
  actual: number;
  target: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">KPI完成趋势</h3>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#1E4B8E]"></span>
            <span className="text-slate-600">实际完成</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-300"></span>
            <span className="text-slate-600">目标值</span>
          </div>
        </div>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1E4B8E" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#1E4B8E" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="month" 
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '8px', 
                border: 'none', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '12px'
              }}
              formatter={(value: number, name: string) => [
                `${value}%`, 
                name === 'actual' ? '实际完成' : '目标值'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="target" 
              stroke="#cbd5e1" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#1E4B8E"
              strokeWidth={2.5}
              fill="url(#colorActual)"
              dot={{ fill: '#1E4B8E', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#1E4B8E' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export type { TrendDataPoint };
