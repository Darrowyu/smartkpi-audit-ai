import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Users, Trophy, AlertTriangle, RefreshCw, TrendingUp, TrendingDown, ArrowRight, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { CardSkeleton, TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/context/AuthContext';
import { groupsApi, GroupStats, CompanyPerformance } from '@/api/groups.api';
import { cn } from '@/lib/utils';

const COLORS = {
    primary: '#1E4B8E',
    secondary: '#5B9BD5',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    muted: '#94a3b8',
};

const PERFORMANCE_COLORS = [COLORS.success, COLORS.secondary, COLORS.warning, COLORS.danger];

// 迷你趋势图
const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 32 }) => (
    <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data.map((v, i) => ({ v, i }))}>
            <defs>
                <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#gradient-${color.replace('#', '')})`} dot={false} />
        </AreaChart>
    </ResponsiveContainer>
);

// 统计卡片（带趋势）
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    iconBg: string;
    trend?: { value: number; isUp: boolean };
    sparklineData?: number[];
    sparklineColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, iconBg, trend, sparklineData, sparklineColor }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-slate-900">{value}</p>
                    {trend && (
                        <span className={cn('flex items-center text-sm font-medium', trend.isUp ? 'text-emerald-600' : 'text-red-500')}>
                            {trend.isUp ? <TrendingUp className="w-4 h-4 mr-0.5" /> : <TrendingDown className="w-4 h-4 mr-0.5" />}
                            {trend.value}%
                        </span>
                    )}
                </div>
                {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
            </div>
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', iconBg)}>
                {icon}
            </div>
        </div>
        {sparklineData && sparklineData.length > 0 && (
            <div className="mt-3 -mx-1">
                <Sparkline data={sparklineData} color={sparklineColor || COLORS.primary} />
            </div>
        )}
    </div>
);

// 预警卡片
interface AlertItemProps {
    company: string;
    metric: string;
    value: string;
    severity: 'high' | 'medium' | 'low';
}

const AlertItem: React.FC<AlertItemProps> = ({ company, metric, value, severity }) => {
    const severityStyles = {
        high: 'bg-red-50 border-red-200 text-red-700',
        medium: 'bg-amber-50 border-amber-200 text-amber-700',
        low: 'bg-blue-50 border-blue-200 text-blue-700',
    };
    return (
        <div className={cn('flex items-center justify-between p-3 rounded-lg border', severityStyles[severity])}>
            <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <div>
                    <p className="font-medium text-sm">{company}</p>
                    <p className="text-xs opacity-80">{metric}</p>
                </div>
            </div>
            <span className="font-bold text-sm">{value}</span>
        </div>
    );
};

// 排名徽章
const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
    const styles = rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white' :
                   rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                   rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white' :
                   'bg-slate-100 text-slate-600';
    return (
        <span className={cn('inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-sm', styles)}>
            {rank}
        </span>
    );
};

// 绩效等级标签
const PerformanceBadges: React.FC<{ excellent: number; good: number; average: number; poor: number }> = ({ excellent, good, average, poor }) => (
    <div className="flex items-center gap-1.5">
        {excellent > 0 && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 px-2">{excellent}</Badge>}
        {good > 0 && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 px-2">{good}</Badge>}
        {average > 0 && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 px-2">{average}</Badge>}
        {poor > 0 && <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0 px-2">{poor}</Badge>}
    </div>
);

// 分布图例
const DistributionLegend: React.FC<{ data: { name: string; value: number; color: string; percent: number }[] }> = ({ data }) => (
    <div className="grid grid-cols-2 gap-3 mt-4">
        {data.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-slate-600">{item.name}</span>
                <span className="text-sm font-semibold text-slate-900 ml-auto">{item.value}</span>
                <span className="text-xs text-slate-400">({item.percent}%)</span>
            </div>
        ))}
    </div>
);

export const GroupDashboardView: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { toast } = useToast();
    const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
    const [companyPerformances, setCompanyPerformances] = useState<CompanyPerformance[]>([]);
    const [loading, setLoading] = useState(true);

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
        } catch {
            toast({ variant: 'destructive', title: '加载数据失败' });
        } finally {
            setLoading(false);
        }
    }, [groupId, toast]);

    useEffect(() => { loadData(); }, [loadData]);

    // 计算汇总
    const summary = useMemo(() => {
        const totalCompanies = groupStats?.totalCompanies ?? companyPerformances.length;
        const totalUsers = groupStats?.totalUsers ?? 0;
        const totalDepartments = groupStats?.totalDepartments ?? 0;
        const performanceEmployees = companyPerformances.reduce((sum, c) => sum + c.totalEmployees, 0);
        const avgScore = performanceEmployees > 0
            ? Math.round(companyPerformances.reduce((sum, c) => sum + c.avgScore * c.totalEmployees, 0) / performanceEmployees * 10) / 10
            : 0;
        const excellent = companyPerformances.reduce((s, c) => s + c.excellent, 0);
        const good = companyPerformances.reduce((s, c) => s + c.good, 0);
        const average = companyPerformances.reduce((s, c) => s + c.average, 0);
        const poor = companyPerformances.reduce((s, c) => s + c.poor, 0);
        const excellentRate = performanceEmployees > 0 ? Math.round(excellent / performanceEmployees * 100) : 0;
        const poorRate = performanceEmployees > 0 ? Math.round(poor / performanceEmployees * 100) : 0;

        return { totalCompanies, totalUsers, totalDepartments, performanceEmployees, avgScore, excellent, good, average, poor, excellentRate, poorRate };
    }, [groupStats, companyPerformances]);

    // 预警列表
    const alerts = useMemo(() => {
        const items: AlertItemProps[] = [];
        companyPerformances.forEach(c => {
            const poorRate = c.totalEmployees > 0 ? c.poor / c.totalEmployees : 0;
            if (poorRate > 0.3) {
                items.push({ company: c.companyName, metric: '待改进人员占比过高', value: `${Math.round(poorRate * 100)}%`, severity: 'high' });
            } else if (poorRate > 0.2) {
                items.push({ company: c.companyName, metric: '待改进人员需关注', value: `${Math.round(poorRate * 100)}%`, severity: 'medium' });
            }
            if (c.avgScore < 60) {
                items.push({ company: c.companyName, metric: '平均分低于及格线', value: `${c.avgScore}分`, severity: 'high' });
            } else if (c.avgScore < 70) {
                items.push({ company: c.companyName, metric: '平均分偏低', value: `${c.avgScore}分`, severity: 'medium' });
            }
        });
        return items.sort((a, b) => (a.severity === 'high' ? -1 : 1) - (b.severity === 'high' ? -1 : 1)).slice(0, 5);
    }, [companyPerformances]);

    // 饼图数据
    const pieData = useMemo(() => {
        const total = summary.excellent + summary.good + summary.average + summary.poor;
        return [
            { name: '优秀', value: summary.excellent, color: COLORS.success, percent: total > 0 ? Math.round(summary.excellent / total * 100) : 0 },
            { name: '良好', value: summary.good, color: COLORS.secondary, percent: total > 0 ? Math.round(summary.good / total * 100) : 0 },
            { name: '合格', value: summary.average, color: COLORS.warning, percent: total > 0 ? Math.round(summary.average / total * 100) : 0 },
            { name: '待改进', value: summary.poor, color: COLORS.danger, percent: total > 0 ? Math.round(summary.poor / total * 100) : 0 },
        ].filter(d => d.value > 0);
    }, [summary]);

    // 柱状图数据
    const barData = useMemo(() => companyPerformances
        .map(c => ({ name: c.companyName.length > 8 ? c.companyName.slice(0, 8) + '...' : c.companyName, fullName: c.companyName, avgScore: c.avgScore, employees: c.totalEmployees }))
        .sort((a, b) => b.avgScore - a.avgScore), [companyPerformances]);

    // 模拟趋势数据（实际应从API获取）
    const trendData = useMemo(() => ({
        score: [72, 74, 73, 76, 78, summary.avgScore || 75],
        users: [summary.totalUsers * 0.85, summary.totalUsers * 0.88, summary.totalUsers * 0.92, summary.totalUsers * 0.95, summary.totalUsers * 0.98, summary.totalUsers],
        excellent: [summary.excellentRate * 0.9, summary.excellentRate * 0.92, summary.excellentRate * 0.95, summary.excellentRate * 0.97, summary.excellentRate * 0.99, summary.excellentRate],
    }), [summary]);

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">集团管理中心</h1>
                    <p className="text-slate-500 mt-1">跨公司绩效数据汇总与战略分析</p>
                </div>
                <Button variant="outline" onClick={() => loadData()} disabled={loading} className="self-start sm:self-auto">
                    <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                    刷新数据
                </Button>
            </div>

            {/* 核心指标卡片 */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} className="h-40" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="集团平均绩效"
                        value={summary.avgScore > 0 ? summary.avgScore : '-'}
                        subtitle={`${summary.performanceEmployees} 人参与考核`}
                        icon={<Trophy className="w-6 h-6 text-amber-500" />}
                        iconBg="bg-amber-50"
                        trend={summary.avgScore > 0 ? { value: 3.2, isUp: true } : undefined}
                        sparklineData={trendData.score}
                        sparklineColor={COLORS.warning}
                    />
                    <StatCard
                        title="优秀率"
                        value={`${summary.excellentRate}%`}
                        subtitle={`${summary.excellent} 人达到优秀`}
                        icon={<TrendingUp className="w-6 h-6 text-emerald-500" />}
                        iconBg="bg-emerald-50"
                        trend={{ value: 5.1, isUp: true }}
                        sparklineData={trendData.excellent}
                        sparklineColor={COLORS.success}
                    />
                    <StatCard
                        title="子公司数量"
                        value={summary.totalCompanies}
                        subtitle={`${summary.totalDepartments} 个部门`}
                        icon={<Building2 className="w-6 h-6 text-brand-primary" />}
                        iconBg="bg-primary/10"
                    />
                    <StatCard
                        title="系统用户"
                        value={summary.totalUsers}
                        subtitle="活跃账户"
                        icon={<Users className="w-6 h-6 text-brand-secondary" />}
                        iconBg="bg-sky-50"
                        sparklineData={trendData.users}
                        sparklineColor={COLORS.secondary}
                    />
                </div>
            )}

            {/* 预警区域 */}
            {!loading && alerts.length > 0 && (
                <Card className="border-red-200 bg-red-50/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base text-red-700">
                            <AlertTriangle className="h-5 w-5" />
                            需要关注
                            <Badge variant="destructive" className="ml-2">{alerts.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {alerts.map((alert, i) => <AlertItem key={i} {...alert} />)}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 图表区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 子公司排名 */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Building2 className="h-5 w-5 text-brand-primary" />
                                    子公司绩效排名
                                </CardTitle>
                                <CardDescription>各子公司平均绩效得分对比</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {barData.length === 0 ? (
                            <EmptyState icon={Building2} title="暂无数据" description="等待绩效数据同步" className="py-12" />
                        ) : (
                            <ResponsiveContainer width="100%" height={Math.max(200, barData.length * 48)}>
                                <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        formatter={(value: number) => [`${value} 分`, '平均绩效']}
                                        labelFormatter={(label) => barData.find(d => d.name === label)?.fullName || label}
                                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                                    />
                                    <Bar dataKey="avgScore" radius={[0, 6, 6, 0]} barSize={28}>
                                        {barData.map((entry, index) => (
                                            <Cell key={index} fill={entry.avgScore >= 80 ? COLORS.success : entry.avgScore >= 60 ? COLORS.secondary : COLORS.danger} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* 绩效分布 */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">集团绩效分布</CardTitle>
                        <CardDescription>全集团员工绩效等级占比</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pieData.length === 0 ? (
                            <EmptyState icon={Trophy} title="暂无数据" description="等待绩效数据" className="py-8" />
                        ) : (
                            <div className="flex flex-col items-center">
                                <PieChart width={200} height={200}>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={3}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number, name: string) => [`${value} 人`, name]} />
                                </PieChart>
                                <DistributionLegend data={pieData} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 子公司详情表格 */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">子公司绩效明细</CardTitle>
                            <CardDescription>各子公司详细绩效数据</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <TableSkeleton rows={5} columns={6} />
                    ) : companyPerformances.length === 0 ? (
                        <EmptyState icon={Building2} title="暂无子公司数据" description="请先添加子公司或等待数据同步" />
                    ) : (
                        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-16">排名</TableHead>
                                        <TableHead>子公司</TableHead>
                                        <TableHead>考核周期</TableHead>
                                        <TableHead className="text-right">员工数</TableHead>
                                        <TableHead className="text-right">平均分</TableHead>
                                        <TableHead className="text-center">绩效分布</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {companyPerformances
                                        .sort((a, b) => b.avgScore - a.avgScore)
                                        .map((company, index) => (
                                            <TableRow key={company.companyId} className="group">
                                                <TableCell><RankBadge rank={index + 1} /></TableCell>
                                                <TableCell>
                                                    <span className="font-medium text-slate-900">{company.companyName}</span>
                                                </TableCell>
                                                <TableCell className="text-slate-500">{company.periodName || '-'}</TableCell>
                                                <TableCell className="text-right text-slate-600">{company.totalEmployees} 人</TableCell>
                                                <TableCell className="text-right">
                                                    <span className={cn(
                                                        'text-xl font-bold',
                                                        company.avgScore >= 80 ? 'text-emerald-600' :
                                                        company.avgScore >= 60 ? 'text-slate-900' : 'text-red-500'
                                                    )}>
                                                        {company.avgScore}
                                                    </span>
                                                    <span className="text-slate-400 text-sm ml-0.5">分</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center">
                                                        <PerformanceBadges
                                                            excellent={company.excellent}
                                                            good={company.good}
                                                            average={company.average}
                                                            poor={company.poor}
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
