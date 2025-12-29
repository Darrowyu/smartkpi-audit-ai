import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { PerformanceOverview } from '@/api/reports.api';

interface PerformanceOverviewCardsProps {
    data: PerformanceOverview | null;
    loading?: boolean;
}

export const PerformanceOverviewCards: React.FC<PerformanceOverviewCardsProps> = memo(({ data, loading }) => {
    const { t } = useTranslation();

    if (loading) { // 骨架屏加载态
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="pb-2"><div className="h-4 bg-slate-200 rounded w-24" /></CardHeader>
                        <CardContent><div className="h-8 bg-slate-200 rounded w-16" /></CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!data) return null;

    const excellentRate = data.totalEmployees > 0 ? Math.round((data.excellent / data.totalEmployees) * 100) : 0;
    const poorRate = data.totalEmployees > 0 ? Math.round((data.poor / data.totalEmployees) * 100) : 0;

    const cards = [
        {
            title: t('reports.totalParticipants', '参与人数'),
            value: data.totalEmployees,
            icon: Users,
            iconColor: 'text-primary',
            desc: data.periodName,
        },
        {
            title: t('reports.avgScore', '平均得分'),
            value: `${data.avgScore}${t('reports.scoreUnit', '分')}`,
            icon: Trophy,
            iconColor: data.avgScore >= 80 ? 'text-green-500' : 'text-yellow-500',
            desc: data.avgScore >= 80 ? t('reports.performanceExcellent', '整体优秀') : t('reports.performanceNormal', '正常水平'),
        },
        {
            title: t('reports.excellentRate', '优秀率'),
            value: `${excellentRate}%`,
            icon: ArrowUpRight,
            iconColor: 'text-green-500',
            desc: t('reports.excellentCount', { count: data.excellent }),
        },
        {
            title: t('reports.needsImprovement', '待改进'),
            value: `${poorRate}%`,
            icon: AlertTriangle,
            iconColor: 'text-red-500',
            desc: t('reports.poorCount', { count: data.poor }),
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, i) => (
                <Card key={i} className="transition-shadow hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                        <p className="text-xs text-muted-foreground">{card.desc}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
});

PerformanceOverviewCards.displayName = 'PerformanceOverviewCards';
