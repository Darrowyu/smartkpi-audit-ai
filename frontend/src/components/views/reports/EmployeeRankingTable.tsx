import React, { memo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Medal, User } from 'lucide-react';
import { reportsApi, EmployeeRanking } from '@/api/reports.api';

interface EmployeeRankingTableProps {
    periodId: string;
    pageSize?: number;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    EXCELLENT: { label: '优秀', className: 'bg-green-100 text-green-800 border-green-200' },
    GOOD: { label: '良好', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    AVERAGE: { label: '合格', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    POOR: { label: '待改进', className: 'bg-red-100 text-red-800 border-red-200' },
};

export const EmployeeRankingTable: React.FC<EmployeeRankingTableProps> = memo(({ periodId, pageSize = 10 }) => {
    const { t } = useTranslation();
    const [employees, setEmployees] = useState<EmployeeRanking[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        if (!periodId) return;
        setLoading(true);
        try {
            const res = await reportsApi.getEmployeeRanking(periodId, page, pageSize);
            setEmployees(res.data);
            setTotal(res.total);
        } catch { /* 静默处理 */ }
        finally { setLoading(false); }
    }, [periodId, page, pageSize]);

    useEffect(() => { loadData(); }, [loadData]);
    useEffect(() => { setPage(1); }, [periodId]); // 周期变化时重置页码

    const totalPages = Math.ceil(total / pageSize);

    const getRankIcon = (rank: number) => { // 前三名显示奖牌
        if (rank === 1) return <Medal className="h-5 w-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
        if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
        return <span className="text-muted-foreground">{rank}</span>;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t('reports.employeeRanking', '员工绩效排名')}
                </CardTitle>
                <CardDescription>{t('reports.employeeRankingDesc', '按绩效得分从高到低排列')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">{t('reports.rank', '排名')}</TableHead>
                            <TableHead>{t('reports.employeeName', '员工姓名')}</TableHead>
                            <TableHead>{t('reports.department', '部门')}</TableHead>
                            <TableHead className="text-right">{t('reports.score', '得分')}</TableHead>
                            <TableHead className="text-center">{t('reports.status', '状态')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} columns={5} />)
                        ) : employees.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('reports.noData', '暂无数据')}</TableCell></TableRow>
                        ) : employees.map((emp) => {
                            const status = statusConfig[emp.status] || statusConfig.AVERAGE;
                            return (
                                <TableRow key={emp.employeeId} className="hover:bg-muted/50">
                                    <TableCell className="font-medium">{getRankIcon(emp.rank)}</TableCell>
                                    <TableCell className="font-medium">{emp.employeeName}</TableCell>
                                    <TableCell className="text-muted-foreground">{emp.departmentName}</TableCell>
                                    <TableCell className="text-right font-bold">{emp.score}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={status.className}>
                                            {t(`reports.status${emp.status}`, status.label)}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                {totalPages > 1 && ( // 分页控件
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <span className="text-sm text-muted-foreground">
                            {t('reports.pagination', { page, total: totalPages, count: total })}
                        </span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});

EmployeeRankingTable.displayName = 'EmployeeRankingTable';
