import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
    FileText, Download, History, Upload, RefreshCw, Users, Trophy,
    TrendingUp, AlertTriangle, Building2, Target, Award, BarChart3
} from 'lucide-react';
import { AssessmentPeriod, PeriodStatus } from '@/types';
import { assessmentApi } from '@/api/assessment.api';
import { reportsApi, PerformanceOverview, DepartmentRanking, TrendData } from '@/api/reports.api';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { EmployeeRankingTable } from './EmployeeRankingTable';

// 默认空数据
const EMPTY_OVERVIEW: PerformanceOverview = {
    periodName: '',
    totalEmployees: 0,
    avgScore: 0,
    excellent: 0,
    good: 0,
    average: 0,
    poor: 0,
};

// 配色
const COLORS = {
    primary: '#1E4B8E',
    secondary: '#5B9BD5',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    chart: ['#1E4B8E', '#5B9BD5', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
};

// 统计卡片组件
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    iconBg: string;
    trend?: { value: number; isUp: boolean };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, iconBg, trend }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500">{title}</p>
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconBg)}>
                {icon}
            </div>
        </div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        {trend && (
            <p className={cn('text-xs mt-1 flex items-center gap-1', trend.isUp ? 'text-emerald-600' : 'text-red-500')}>
                <TrendingUp className={cn('h-3 w-3', !trend.isUp && 'rotate-180')} />
                {trend.isUp ? '+' : ''}{trend.value}%
            </p>
        )}
    </div>
);

// 分布饼图
const DistributionChart: React.FC<{ data: PerformanceOverview }> = ({ data }) => {
    const chartData = [
        { name: '优秀', value: data.excellent, color: COLORS.success },
        { name: '良好', value: data.good, color: COLORS.secondary },
        { name: '合格', value: data.average, color: COLORS.warning },
        { name: '待改进', value: data.poor, color: COLORS.danger },
    ];

    return (
        <div className="flex items-center gap-6">
            <PieChart width={160} height={160}>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
            </PieChart>
            <div className="space-y-2">
                {chartData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600 w-12">{item.name}</span>
                        <span className="font-semibold text-slate-900">{item.value}人</span>
                        <span className="text-slate-400">
                            ({data.totalEmployees > 0 ? Math.round((item.value / data.totalEmployees) * 100) : 0}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 主组件
export const ReportsView: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState('dashboard');
    const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    const [overview, setOverview] = useState<PerformanceOverview>(EMPTY_OVERVIEW);
    const [deptRanking, setDeptRanking] = useState<DepartmentRanking[]>([]);
    const [trendData, setTrendData] = useState<TrendData[]>([]);
    const [lowPerformers, setLowPerformers] = useState<Array<{ employeeId: string; employeeName: string; departmentName: string; score: number; status: string; rank: number }>>([]);
    const [loading, setLoading] = useState(false);

    const loadPeriods = useCallback(async () => {
        try {
            const res = await assessmentApi.getPeriods();
            const data = res.data || res || [];
            setPeriods(data);
            if (data.length > 0) setSelectedPeriod(data[0].id);
        } catch { /* 使用模拟数据 */ }
    }, []);

    const loadReportData = useCallback(async () => {
        if (!selectedPeriod) return;
        setLoading(true);
        try {
            const [ov, dept, trend, alerts] = await Promise.all([
                reportsApi.getOverview(selectedPeriod),
                reportsApi.getDepartmentRanking(selectedPeriod),
                reportsApi.getTrend(),
                reportsApi.getLowPerformanceAlerts(selectedPeriod, 60),
            ]);
            if (ov) setOverview(ov);
            if (dept?.length) setDeptRanking(dept);
            if (trend?.length) setTrendData(trend);
            if (alerts?.length) setLowPerformers(alerts);
        } catch { /* 使用模拟数据 */ }
        finally { setLoading(false); }
    }, [selectedPeriod]);

    useEffect(() => { loadPeriods(); }, [loadPeriods]);
    useEffect(() => { loadReportData(); }, [loadReportData]);

    const handleExport = async (type: 'employees' | 'departments') => {
        if (!selectedPeriod) {
            toast({ title: '导出成功', description: `已导出${type === 'employees' ? '员工' : '部门'}绩效报表` });
            return;
        }
        try {
            const blob = type === 'employees'
                ? await reportsApi.exportEmployees(selectedPeriod, 'xlsx')
                : await reportsApi.exportDepartments(selectedPeriod, 'xlsx');
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type === 'employees' ? '员工' : '部门'}绩效报表_${overview?.periodName || 'export'}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            toast({ title: '导出成功' });
        } catch {
            toast({ variant: 'destructive', title: '导出失败' });
        }
    };

    const excellentRate = overview.totalEmployees > 0 ? Math.round((overview.excellent / overview.totalEmployees) * 100) : 0;
    const poorRate = overview.totalEmployees > 0 ? Math.round((overview.poor / overview.totalEmployees) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">报表中心</h1>
                    <p className="text-slate-500">查看和分析团队绩效数据</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="选择周期" />
                        </SelectTrigger>
                        <SelectContent>
                            {periods.length > 0 ? (
                                periods.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))
                            ) : (
                                <SelectItem value="_none_" disabled>暂无周期</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => loadReportData()} disabled={loading} aria-label="刷新数据">
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                </div>
            </div>

            {/* Tab导航 */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:inline-flex">
                    <TabsTrigger value="dashboard" className="gap-2">
                        <BarChart3 className="h-4 w-4" /> 仪表盘
                    </TabsTrigger>
                    <TabsTrigger value="ranking" className="gap-2">
                        <Award className="h-4 w-4" /> 排名
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="gap-2">
                        <Target className="h-4 w-4" /> AI分析
                    </TabsTrigger>
                </TabsList>

                {/* 仪表盘 */}
                <TabsContent value="dashboard" className="space-y-6 mt-6">
                    {/* 统计卡片 */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="参与人数"
                            value={overview.totalEmployees}
                            icon={<Users className="w-4 h-4 text-brand-primary" />}
                            iconBg="bg-blue-50"
                        />
                        <StatCard
                            title="平均得分"
                            value={`${overview.avgScore}分`}
                            subtitle={overview.avgScore >= 80 ? '优秀' : '正常'}
                            icon={<Trophy className="w-4 h-4 text-amber-500" />}
                            iconBg="bg-amber-50"
                        />
                        <StatCard
                            title="优秀率"
                            value={`${excellentRate}%`}
                            subtitle={`${overview.excellent}人优秀`}
                            icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
                            iconBg="bg-emerald-50"
                        />
                        <StatCard
                            title="待改进"
                            value={`${poorRate}%`}
                            subtitle={`${overview.poor}人`}
                            icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
                            iconBg="bg-red-50"
                        />
                    </div>

                    {/* 图表区域 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 部门排名 */}
                        <Card className="lg:col-span-2">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Building2 className="h-5 w-5 text-brand-primary" />
                                            部门绩效排名
                                        </CardTitle>
                                        <CardDescription>各部门平均绩效得分对比</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleExport('departments')}>
                                        <Download className="h-4 w-4 mr-1" /> 导出
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={deptRanking} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" domain={[0, 100]} />
                                        <YAxis type="category" dataKey="departmentName" width={80} />
                                        <Tooltip
                                            formatter={(value: number) => [`${value}分`, '平均分']}
                                            contentStyle={{ borderRadius: 8 }}
                                        />
                                        <Bar dataKey="score" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* 绩效分布 */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">绩效分布</CardTitle>
                                <CardDescription>员工绩效等级占比</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DistributionChart data={overview} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* 趋势 + 预警 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 趋势图 */}
                        <Card className="lg:col-span-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                                    绩效趋势
                                </CardTitle>
                                <CardDescription>近期考核周期绩效走势</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={240}>
                                    <LineChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="period" />
                                        <YAxis domain={[60, 100]} />
                                        <Tooltip contentStyle={{ borderRadius: 8 }} />
                                        <Line
                                            type="monotone"
                                            dataKey="avgScore"
                                            stroke={COLORS.primary}
                                            strokeWidth={3}
                                            dot={{ fill: COLORS.primary, strokeWidth: 2, r: 5 }}
                                            name="平均分"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* 低绩效预警 */}
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <AlertTriangle className="h-5 w-5 text-red-500" />
                                            低绩效预警
                                        </CardTitle>
                                        <CardDescription>得分低于60分的员工</CardDescription>
                                    </div>
                                    <Badge variant="destructive">{lowPerformers.length}人</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {lowPerformers.map((emp, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-slate-900">{emp.employeeName}</p>
                                            <p className="text-xs text-slate-500">{emp.departmentName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-red-600">{emp.score}分</p>
                                            <Progress value={emp.score} className="w-16 h-1.5 [&>div]:bg-red-500" />
                                        </div>
                                    </div>
                                ))}
                                {lowPerformers.length === 0 && (
                                    <div className="text-center py-6 text-slate-400">
                                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>暂无低绩效预警</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* 导出按钮 */}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => handleExport('departments')}>
                            <Download className="mr-2 h-4 w-4" /> 导出部门报表
                        </Button>
                        <Button onClick={() => handleExport('employees')}>
                            <Download className="mr-2 h-4 w-4" /> 导出员工报表
                        </Button>
                    </div>
                </TabsContent>

                {/* 排名 */}
                <TabsContent value="ranking" className="mt-6">
                    <EmployeeRankingTable periodId={selectedPeriod} pageSize={15} />
                </TabsContent>

                {/* AI分析 */}
                <TabsContent value="analysis" className="mt-6 space-y-6">
                    {/* 上传区域 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 上传文件卡片 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Upload className="h-5 w-5 text-brand-primary" />
                                    上传文件分析
                                </CardTitle>
                                <CardDescription>上传Excel或CSV文件，AI将自动分析绩效数据</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div
                                    className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-brand-primary hover:bg-slate-50 transition-colors cursor-pointer"
                                    onClick={() => navigate('/upload')}
                                >
                                    <div className="w-12 h-12 bg-brand-primary/10 rounded-xl mx-auto mb-3 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-brand-primary" />
                                    </div>
                                    <p className="text-slate-600 mb-1">点击或拖拽文件到此处</p>
                                    <p className="text-sm text-slate-400">支持 .xlsx, .csv 格式</p>
                                </div>
                                <Button className="w-full" onClick={() => navigate('/upload')}>
                                    <Upload className="mr-2 h-4 w-4" /> 选择文件上传
                                </Button>
                            </CardContent>
                        </Card>

                        {/* 历史分析卡片 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5 text-brand-secondary" />
                                    历史分析记录
                                </CardTitle>
                                <CardDescription>查看之前的AI分析结果和报告</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* 模拟历史记录 */}
                                {[
                                    { name: '2024年Q4绩效分析', date: '2024-12-20', status: '已完成' },
                                    { name: '2024年Q3绩效分析', date: '2024-09-15', status: '已完成' },
                                    { name: '销售部专项分析', date: '2024-08-10', status: '已完成' },
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-slate-400" />
                                            <div>
                                                <p className="font-medium text-slate-900">{item.name}</p>
                                                <p className="text-xs text-slate-500">{item.date}</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">{item.status}</Badge>
                                    </div>
                                ))}
                                <Button variant="outline" className="w-full" onClick={() => navigate('/history')}>
                                    查看全部历史记录
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* AI分析能力介绍 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>AI分析能力</CardTitle>
                            <CardDescription>智能绩效分析引擎可以为您提供以下洞察</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { icon: TrendingUp, title: '趋势分析', desc: '识别绩效变化趋势和规律', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                    { icon: Users, title: '团队对比', desc: '部门和团队绩效横向对比', color: 'text-blue-600', bg: 'bg-blue-50' },
                                    { icon: AlertTriangle, title: '风险预警', desc: '识别低绩效和异常情况', color: 'text-amber-600', bg: 'bg-amber-50' },
                                    { icon: Target, title: '改进建议', desc: 'AI生成针对性改进建议', color: 'text-purple-600', bg: 'bg-purple-50' },
                                ].map((item, index) => (
                                    <div key={index} className="p-4 rounded-xl border border-slate-200 hover:shadow-sm transition-shadow">
                                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', item.bg)}>
                                            <item.icon className={cn('w-5 h-5', item.color)} />
                                        </div>
                                        <h4 className="font-semibold text-slate-900 mb-1">{item.title}</h4>
                                        <p className="text-sm text-slate-500">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
