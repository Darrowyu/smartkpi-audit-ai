import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface RadarDataPoint {
    subject: string;
    score: number;
    fullMark: number;
}

interface PerformanceRadarChartProps {
    data: RadarDataPoint[];
    title?: string;
}

export const PerformanceRadarChart: React.FC<PerformanceRadarChartProps> = memo(({ data, title }) => {
    const { t } = useTranslation();

    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('charts.noData')}</div>;
    }

    return (
        <div className="w-full h-80">
            {title && <h4 className="text-center font-medium mb-2">{title}</h4>}
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickLine={false}
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 120]}
                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                        tickCount={5}
                    />
                    <Radar
                        name={t('score')}
                        dataKey="score"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.3}
                        strokeWidth={2}
                    />
                    <Tooltip
                        formatter={(value: number) => [`${value.toFixed(1)}${t('dashboardView.avgScoreUnit')}`, t('score')]}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
});

PerformanceRadarChart.displayName = 'PerformanceRadarChart';
