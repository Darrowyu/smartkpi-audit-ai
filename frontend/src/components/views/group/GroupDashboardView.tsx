import React, { useEffect, useState, useCallback, memo } from 'react';
import { Building2, Users, Trophy, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { groupsApi, GroupStats, CompanyPerformance } from '@/api/groups.api';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444']; // 优秀/良好/一般/待改进

export const GroupDashboardView: React.FC = memo(() => {
    const { user } = useAuth();
    const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
    const [companyPerformances, setCompanyPerformances] = useState<CompanyPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const groupId = user?.groupId || (user as any)?.company?.groupId; // 兼容两种数据结构

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const performances = await groupsApi.getGroupPerformance(); // 先获取绩效数据
            setCompanyPerformances(performances || []);
            if (groupId) { // 如果有groupId再获取统计
                const stats = await groupsApi.getGroupStats(groupId);
                setGroupStats(stats);
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : '无法获取集团数据';
            toast({ variant: 'destructive', title: '加载失败', description: msg });
            setCompanyPerformances([]); // 失败时设置空数组
        } finally {
            setLoading(false);
        }
    }, [groupId, toast]);

    useEffect(() => { loadData(); }, [loadData]);

    const totalEmployees = companyPerformances.reduce((sum, c) => sum + c.totalEmployees, 0); // 汇总统计
    const avgScore = companyPerformances.length > 0
        ? Math.round(companyPerformances.reduce((sum, c) => sum + c.avgScore * c.totalEmployees, 0) / totalEmployees * 100) / 100
        : 0;
    const totalPoor = companyPerformances.reduce((sum, c) => sum + c.poor, 0);

    const pieData = [ // 饼图数据
        { name: '优秀', value: companyPerformances.reduce((s, c) => s + c.excellent, 0), color: COLORS[0] },
        { name: '良好', value: companyPerformances.reduce((s, c) => s + c.good, 0), color: COLORS[1] },
        { name: '一般', value: companyPerformances.reduce((s, c) => s + c.average, 0), color: COLORS[2] },
        { name: '待改进', value: companyPerformances.reduce((s, c) => s + c.poor, 0), color: COLORS[3] },
    ].filter(d => d.value > 0);

    const barData = companyPerformances.map(c => ({ // 柱状图数据
        name: c.companyName.length > 8 ? c.companyName.slice(0, 8) + '...' : c.companyName,
        avgScore: c.avgScore,
        employees: c.totalEmployees,
    })).sort((a, b) => b.avgScore - a.avgScore);

    if (loading) {
        return <div className="flex items-center justify-center h-64">加载中...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Makrite 集团绩效中心</h2>
                <p className="text-muted-foreground">全局视角查看所有子公司KPI绩效状况</p>
            </div>

            {/* 统计卡片 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">子公司数量</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{groupStats?.totalCompanies || companyPerformances.length}</div>
                        <p className="text-xs text-muted-foreground">活跃运营中</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">总参评人数</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalEmployees}</div>
                        <p className="text-xs text-muted-foreground">覆盖所有子公司</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">集团平均分</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgScore || '-'}分</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {avgScore >= 80 ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                            {avgScore >= 80 ? '表现优异' : '需关注提升'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">待改进人员</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{totalPoor}</div>
                        <p className="text-xs text-muted-foreground">
                            占比 {totalEmployees > 0 ? Math.round(totalPoor / totalEmployees * 100) : 0}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 图表区域 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>子公司绩效排名</CardTitle>
                        <CardDescription>按平均分从高到低排列</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis type="category" dataKey="name" width={80} />
                                <Tooltip formatter={(value: number) => [`${value}分`, '平均分']} />
                                <Bar dataKey="avgScore" fill="#6366f1" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>集团绩效分布</CardTitle>
                        <CardDescription>全员绩效等级占比</CardDescription>
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
                                <Tooltip formatter={(value: number) => [`${value}人`, '人数']} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* 子公司详情表格 */}
            <Card>
                <CardHeader>
                    <CardTitle>子公司绩效明细</CardTitle>
                    <CardDescription>各子公司考核数据一览</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>排名</TableHead>
                                <TableHead>子公司</TableHead>
                                <TableHead>考核周期</TableHead>
                                <TableHead className="text-right">参评人数</TableHead>
                                <TableHead className="text-right">平均分</TableHead>
                                <TableHead className="text-right">优秀</TableHead>
                                <TableHead className="text-right">良好</TableHead>
                                <TableHead className="text-right">一般</TableHead>
                                <TableHead className="text-right">待改进</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {companyPerformances.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                                        暂无绩效数据，请先在各子公司完成考核计算
                                    </TableCell>
                                </TableRow>
                            ) : (
                                companyPerformances
                                    .sort((a, b) => b.avgScore - a.avgScore)
                                    .map((company, index) => (
                                        <TableRow key={company.companyId}>
                                            <TableCell>
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                                    index === 1 ? 'bg-gray-100 text-gray-800' :
                                                    index === 2 ? 'bg-orange-100 text-orange-800' : ''
                                                }`}>
                                                    {index + 1}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-medium">{company.companyName}</TableCell>
                                            <TableCell>{company.periodName || '-'}</TableCell>
                                            <TableCell className="text-right">{company.totalEmployees}</TableCell>
                                            <TableCell className="text-right font-bold">{company.avgScore}分</TableCell>
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
