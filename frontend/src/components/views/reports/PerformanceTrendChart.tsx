import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface TrendDataPoint {
    period: string;
    avgScore: number;
    employeeCount?: number;
}

interface PerformanceTrendChartProps {
    data: TrendDataPoint[];
    title?: string;
    showEmployeeCount?: boolean;
}

export const PerformanceTrendChart: React.FC<PerformanceTrendChartProps> = memo(({
    data,
    title,
    showEmployeeCount = false
}) => {
    const { t } = useTranslation();

    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('charts.noTrendData')}</div>;
    }

    return (
        <div className="w-full h-80">
            {title && <h4 className="text-center font-medium mb-2">{title}</h4>}
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="period"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickLine={false}
                    />
                    <YAxis
                        domain={[0, 120]}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        formatter={(value: number, name: string) => {
                            if (name === t('charts.avgScore')) return [`${value.toFixed(1)}${t('dashboardView.avgScoreUnit')}`, name];
                            return [value, name];
                        }}
                    />
                    <Legend />
                    <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="5 5" label={{ value: t('charts.passingLine'), fill: '#ef4444', fontSize: 10 }} />
                    <ReferenceLine y={90} stroke="#22c55e" strokeDasharray="5 5" label={{ value: t('charts.excellentLine'), fill: '#22c55e', fontSize: 10 }} />
                    <Line
                        type="monotone"
                        dataKey="avgScore"
                        name={t('charts.avgScore')}
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                    {showEmployeeCount && (
                        <Line
                            type="monotone"
                            dataKey="employeeCount"
                            name={t('charts.participants')}
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                            yAxisId="right"
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
});

PerformanceTrendChart.displayName = 'PerformanceTrendChart';
