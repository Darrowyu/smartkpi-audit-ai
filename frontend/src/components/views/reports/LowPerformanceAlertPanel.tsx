import React, { memo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { reportsApi, EmployeeRanking } from '@/api/reports.api';

interface LowPerformanceAlertPanelProps {
    periodId: string;
    threshold?: number;
    maxItems?: number;
}

export const LowPerformanceAlertPanel: React.FC<LowPerformanceAlertPanelProps> = memo(({
    periodId,
    threshold = 60,
    maxItems = 5
}) => {
    const { t } = useTranslation();
    const [alerts, setAlerts] = useState<EmployeeRanking[]>([]);
    const [loading, setLoading] = useState(false);

    const loadAlerts = useCallback(async () => {
        if (!periodId) return;
        setLoading(true);
        try {
            const data = await reportsApi.getLowPerformanceAlerts(periodId, threshold);
            setAlerts(data.slice(0, maxItems));
        } catch { /* 静默处理 */ }
        finally { setLoading(false); }
    }, [periodId, threshold, maxItems]);

    useEffect(() => { loadAlerts(); }, [loadAlerts]);

    return (
        <Card className="border-red-200 bg-red-50/30">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    {t('reports.lowPerformanceAlert', '低绩效预警')}
                </CardTitle>
                <CardDescription className="text-red-600/70">
                    {t('reports.lowPerformanceAlertDesc', { threshold, defaultValue: `得分低于${threshold}分的员工需要关注` })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                                <Skeleton className="h-6 w-12" />
                            </div>
                        ))}
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="text-center py-6 text-green-600">
                        <div className="text-2xl mb-2">🎉</div>
                        {t('reports.noLowPerformance', '太棒了！没有低绩效员工')}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alerts.map((emp) => (
                            <div key={emp.employeeId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900">{emp.employeeName}</div>
                                        <div className="text-xs text-slate-500">{emp.departmentName}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-red-600">{emp.score}</div>
                                    <div className="text-xs text-slate-500">{t('reports.scoreUnit', '分')}</div>
                                </div>
                            </div>
                        ))}
                        {alerts.length >= maxItems && (
                            <p className="text-center text-sm text-muted-foreground pt-2">
                                {t('reports.viewAllAlerts', '查看员工排名表获取完整列表')}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
});

LowPerformanceAlertPanel.displayName = 'LowPerformanceAlertPanel';
