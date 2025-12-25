import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Users, Trophy, TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { groupsApi, GroupStats, CompanyPerformance } from '@/api/groups.api';
import { cn } from '@/lib/utils';

// 配色
const COLORS = {
    primary: '#1E4B8E',
    secondary: '#5B9BD5',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    chart: ['#10b981', '#5B9BD5', '#f59e0b', '#ef4444'],
};

// 模拟数据
const MOCK_PERFORMANCES: CompanyPerformance[] = [
    { companyId: '1', companyName: '东莞分公司', periodName: '2024年Q4', totalEmployees: 45, avgScore: 88.5, excellent: 15, good: 20, average: 8, poor: 2 },
    { companyId: '2', companyName: '深圳分公司', periodName: '2024年Q4', totalEmployees: 38, avgScore: 85.2, excellent: 12, good: 16, average: 7, poor: 3 },
    { companyId: '3', companyName: '广州分公司', periodName: '2024年Q4', totalEmployees: 32, avgScore: 82.8, excellent: 8, good: 15, average: 6, poor: 3 },
    { companyId: '4', companyName: '佛山分公司', periodName: '2024年Q4', totalEmployees: 25, avgScore: 80.1, excellent: 6, good: 12, average: 5, poor: 2 },
    { companyId: '5', companyName: '惠州分公司', periodName: '2024年Q4', totalEmployees: 16, avgScore: 78.6, excellent: 3, good: 8, average: 3, poor: 2 },
];

// 统计卡片
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    iconBg: string;
    trend?: { value: number; isUp: boolean };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, iconBg, trend }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <p className="text-sm text-slate-500 mb-1">{title}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
                {trend && (
                    <p className={cn('text-xs mt-1 flex items-center gap-1', trend.isUp ? 'text-emerald-600' : 'text-red-500')}>
                        {trend.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {trend.isUp ? '+' : ''}{trend.value}% 较上期
                    </p>
                )}
            </div>
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconBg)}>
                {icon}
            </div>
        </div>
    </div>
);

// 分布饼图
const DistributionChart: React.FC<{ data: { name: string; value: number; color: string }[] }> = ({ data }) => (
    <div className="flex items-center gap-6">
        <PieChart width={160} height={160}>
            <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
            >
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
            </Pie>
        </PieChart>
        <div className="space-y-2">
            {data.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 w-12">{item.name}</span>
                    <span className="font-semibold text-slate-900">{item.value}人</span>
                </div>
            ))}
        </div>
    </div>
);

export const GroupDashboardView: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { toast } = useToast();
    const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
    const [companyPerformances, setCompanyPerformances] = useState<CompanyPerformance[]>(MOCK_PERFORMANCES);
    const [loading, setLoading] = useState(false);

    const groupId = user?.groupId || (user as any)?.company?.groupId;

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const performances = await groupsApi.getGroupPerformance();
            if (performances?.length) setCompanyPerformances(performances);
            if (groupId) {
                const stats = await groupsApi.getGroupStats(groupId);
                setGroupStats(stats);
            }
        } catch {
            // 使用模拟数据
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useEffect(() => { loadData(); }, [loadData]);

    // 计算汇总
    const totalEmployees = companyPerformances.reduce((sum, c) => sum + c.totalEmployees, 0);
    const avgScore = companyPerformances.length > 0
        ? Math.round(companyPerformances.reduce((sum, c) => sum + c.avgScore * c.totalEmployees, 0) / totalEmployees * 100) / 100
        : 0;
    const totalPoor = companyPerformances.reduce((sum, c) => sum + c.poor, 0);

    // 饼图数据
    const pieData = [
        { name: '优秀', value: companyPerformances.reduce((s, c) => s + c.excellent, 0), color: COLORS.success },
        { name: '良好', value: companyPerformances.reduce((s, c) => s + c.good, 0), color: COLORS.secondary },
        { name: '合格', value: companyPerformances.reduce((s, c) => s + c.average, 0), color: COLORS.warning },
        { name: '待改进', value: companyPerformances.reduce((s, c) => s + c.poor, 0), color: COLORS.danger },
    ].filter(d => d.value > 0);

    // 柱状图数据
    const barData = companyPerformances
        .map(c => ({ name: c.companyName.length > 6 ? c.companyName.slice(0, 6) + '...' : c.companyName, avgScore: c.avgScore, employees: c.totalEmployees }))
        .sort((a, b) => b.avgScore - a.avgScore);

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">集团管理中心</h1>
                    <p className="text-slate-500">跨公司绩效数据汇总与分析</p>
                </div>
                <Button variant="outline" onClick={() => loadData()} disabled={loading}>
                    <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                    刷新数据
                </Button>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="子公司数量"
                    value={groupStats?.totalCompanies || companyPerformances.length}
                    subtitle="活跃运营中"
                    icon={<Building2 className="w-6 h-6 text-[#1E4B8E]" />}
                    iconBg="bg-blue-50"
                />
                <StatCard
                    title="总员工数"
                    value={totalEmployees}
                    subtitle="覆盖所有子公司"
                    icon={<Users className="w-6 h-6 text-[#5B9BD5]" />}
                    iconBg="bg-sky-50"
                    trend={{ value: 3.2, isUp: true }}
                />
                <StatCard
                    title="集团平均分"
                    value={`${avgScore}分`}
                    subtitle={avgScore >= 80 ? '整体表现优秀' : '需要关注'}
                    icon={<Trophy className="w-6 h-6 text-amber-500" />}
                    iconBg="bg-amber-50"
                    trend={{ value: 2.1, isUp: true }}
                />
                <StatCard
                    title="待改进人数"
                    value={totalPoor}
                    subtitle={`占比 ${totalEmployees > 0 ? Math.round(totalPoor / totalEmployees * 100) : 0}%`}
                    icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
                    iconBg="bg-red-50"
                    trend={{ value: 1.5, isUp: false }}
                />
            </div>

            {/* 图表区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 子公司排名 */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Building2 className="h-5 w-5 text-[#1E4B8E]" />
                            子公司绩效排名
                        </CardTitle>
                        <CardDescription>各子公司平均绩效得分对比</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={barData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis type="category" dataKey="name" width={70} />
                                <Tooltip formatter={(value: number) => [`${value}分`, '平均分']} contentStyle={{ borderRadius: 8 }} />
                                <Bar dataKey="avgScore" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 绩效分布 */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">集团绩效分布</CardTitle>
                        <CardDescription>全集团员工绩效等级占比</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DistributionChart data={pieData} />
                    </CardContent>
                </Card>
            </div>

            {/* 子公司详情表格 */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">子公司绩效明细</CardTitle>
                    <CardDescription>各子公司详细绩效数据</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">排名</TableHead>
                                    <TableHead>子公司</TableHead>
                                    <TableHead>考核周期</TableHead>
                                    <TableHead className="text-right">员工数</TableHead>
                                    <TableHead className="text-right">平均分</TableHead>
                                    <TableHead className="text-center">绩效分布</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {companyPerformances.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                            暂无数据
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    companyPerformances
                                        .sort((a, b) => b.avgScore - a.avgScore)
                                        .map((company, index) => (
                                            <TableRow key={company.companyId}>
                                                <TableCell>
                                                    <span className={cn(
                                                        'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                                                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                        index === 1 ? 'bg-slate-100 text-slate-600' :
                                                        index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'
                                                    )}>
                                                        {index + 1}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-medium">{company.companyName}</TableCell>
                                                <TableCell className="text-slate-500">{company.periodName || '-'}</TableCell>
                                                <TableCell className="text-right">{company.totalEmployees}人</TableCell>
                                                <TableCell className="text-right">
                                                    <span className="text-lg font-bold text-slate-900">{company.avgScore}</span>
                                                    <span className="text-slate-400 text-sm">分</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">{company.excellent}</Badge>
                                                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">{company.good}</Badge>
                                                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">{company.average}</Badge>
                                                        <Badge variant="secondary" className="bg-red-100 text-red-700">{company.poor}</Badge>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
