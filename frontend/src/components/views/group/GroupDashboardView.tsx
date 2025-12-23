import React, { useEffect, useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Users, Trophy, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { groupsApi, GroupStats, CompanyPerformance } from '@/api/groups.api';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

export const GroupDashboardView: React.FC = memo(() => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
    const [companyPerformances, setCompanyPerformances] = useState<CompanyPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const groupId = user?.groupId || (user as any)?.company?.groupId;

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const performances = await groupsApi.getGroupPerformance();
            setCompanyPerformances(performances || []);
            if (groupId) {
                const stats = await groupsApi.getGroupStats(groupId);
                setGroupStats(stats);
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : t('common.loadFailed');
            toast({ variant: 'destructive', title: t('common.loadFailed'), description: msg });
            setCompanyPerformances([]);
        } finally {
            setLoading(false);
        }
    }, [groupId, toast, t]);

    useEffect(() => { loadData(); }, [loadData]);

    const totalEmployees = companyPerformances.reduce((sum, c) => sum + c.totalEmployees, 0);
    const avgScore = companyPerformances.length > 0
        ? Math.round(companyPerformances.reduce((sum, c) => sum + c.avgScore * c.totalEmployees, 0) / totalEmployees * 100) / 100
        : 0;
    const totalPoor = companyPerformances.reduce((sum, c) => sum + c.poor, 0);

    const pieData = [
        { name: t('groupDashboard.excellent'), value: companyPerformances.reduce((s, c) => s + c.excellent, 0), color: COLORS[0] },
        { name: t('groupDashboard.good'), value: companyPerformances.reduce((s, c) => s + c.good, 0), color: COLORS[1] },
        { name: t('groupDashboard.average'), value: companyPerformances.reduce((s, c) => s + c.average, 0), color: COLORS[2] },
        { name: t('groupDashboard.poor'), value: companyPerformances.reduce((s, c) => s + c.poor, 0), color: COLORS[3] },
    ].filter(d => d.value > 0);

    const barData = companyPerformances.map(c => ({
        name: c.companyName.length > 8 ? c.companyName.slice(0, 8) + '...' : c.companyName,
        avgScore: c.avgScore,
        employees: c.totalEmployees,
    })).sort((a, b) => b.avgScore - a.avgScore);

    if (loading) {
        return <div className="flex items-center justify-center h-64">{t('loading')}</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{t('groupDashboard.title')}</h2>
                <p className="text-muted-foreground">{t('groupDashboard.subtitle')}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('groupDashboard.totalCompanies')}</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{groupStats?.totalCompanies || companyPerformances.length}</div>
                        <p className="text-xs text-muted-foreground">{t('active')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('groupDashboard.totalEmployees')}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalEmployees}</div>
                        <p className="text-xs text-muted-foreground">{t('groupDashboard.coverAllSubsidiaries')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('groupDashboard.groupAvgScore')}</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgScore || '-'}{t('dashboardView.avgScoreUnit')}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {avgScore >= 80 ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                            {avgScore >= 80 ? t('groupDashboard.performanceExcellent') : t('groupDashboard.needsAttention')}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('groupDashboard.needsImprovement')}</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{totalPoor}</div>
                        <p className="text-xs text-muted-foreground">
                            {t('groupDashboard.percentage', { percent: totalEmployees > 0 ? Math.round(totalPoor / totalEmployees * 100) : 0 })}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>{t('groupDashboard.subsidiaryRanking')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis type="category" dataKey="name" width={80} />
                                <Tooltip formatter={(value: number) => [`${value}${t('dashboardView.avgScoreUnit')}`, t('groupDashboard.avgScore')]} />
                                <Bar dataKey="avgScore" fill="#6366f1" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>{t('groupDashboard.performanceDistribution')}</CardTitle>
                        <CardDescription>{t('groupDashboard.distributionDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('groupDashboard.subsidiaryDetails')}</CardTitle>
                    <CardDescription>{t('groupDashboard.detailsDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('groupDashboard.rank')}</TableHead>
                                <TableHead>{t('groupDashboard.subsidiary')}</TableHead>
                                <TableHead>{t('assessmentPeriod')}</TableHead>
                                <TableHead className="text-right">{t('groupDashboard.employeeCount')}</TableHead>
                                <TableHead className="text-right">{t('groupDashboard.avgScore')}</TableHead>
                                <TableHead className="text-right">{t('groupDashboard.excellent')}</TableHead>
                                <TableHead className="text-right">{t('groupDashboard.good')}</TableHead>
                                <TableHead className="text-right">{t('groupDashboard.average')}</TableHead>
                                <TableHead className="text-right">{t('groupDashboard.poor')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {companyPerformances.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                                        {t('assignment.noData')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                companyPerformances
                                    .sort((a, b) => b.avgScore - a.avgScore)
                                    .map((company, index) => (
                                        <TableRow key={company.companyId}>
                                            <TableCell>
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                                        index === 1 ? 'bg-gray-100 text-gray-800' :
                                                            index === 2 ? 'bg-orange-100 text-orange-800' : ''
                                                    }`}>
                                                    {index + 1}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-medium">{company.companyName}</TableCell>
                                            <TableCell>{company.periodName || '-'}</TableCell>
                                            <TableCell className="text-right">{company.totalEmployees}</TableCell>
                                            <TableCell className="text-right font-bold">{company.avgScore}{t('dashboardView.avgScoreUnit')}</TableCell>
                                            <TableCell className="text-right text-green-600">{company.excellent}</TableCell>
                                            <TableCell className="text-right text-blue-600">{company.good}</TableCell>
                                            <TableCell className="text-right text-yellow-600">{company.average}</TableCell>
                                            <TableCell className="text-right text-red-600">{company.poor}</TableCell>
                                        </TableRow>
                                    ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
});

GroupDashboardView.displayName = 'GroupDashboardView';
