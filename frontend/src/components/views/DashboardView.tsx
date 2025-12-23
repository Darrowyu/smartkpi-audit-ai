import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Users, Trophy, AlertTriangle, Download } from 'lucide-react';
import { assessmentApi } from '@/api/assessment.api';
import { reportsApi } from '@/api/reports.api';
import { AssessmentPeriod, PeriodStatus } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface OverviewData {
  periodName: string;
  totalEmployees: number;
  avgScore: number;
  excellent: number;
  good: number;
  average: number;
  poor: number;
}

interface DashboardViewProps {
  language?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ language }) => {
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [deptRanking, setDeptRanking] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    loadPeriods();
    loadTrend();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadPeriodData(selectedPeriod);
    }
  }, [selectedPeriod]);

  const loadPeriods = async () => {
    try {
      const response = await assessmentApi.getPeriods();
      const periodsData = response.data || response || []; // 兼容 { data, meta } 或直接数组
      setPeriods(periodsData);
      if (periodsData.length > 0) {
        setSelectedPeriod(periodsData[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadTrend = async () => {
    try {
      const data = await reportsApi.getTrend();
      setTrendData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPeriodData = async (id: string) => {
    try {
      const [ov, dept] = await Promise.all([
        reportsApi.getOverview(id),
        reportsApi.getDepartmentRanking(id),
      ]);
      setOverview(ov);
      setDeptRanking(dept);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = async () => {
    if (!selectedPeriod) return;
    try {
      const blob = await reportsApi.exportEmployees(selectedPeriod, 'xlsx');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Performance_Report_${overview?.periodName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">绩效仪表盘</h2>
          <p className="text-muted-foreground">实时监控企业绩效考核状态与结果</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择周期" />
            </SelectTrigger>
            <SelectContent>
              {periods.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> 导出报表
          </Button>
        </div>
      </div>

      {overview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总参评人数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalEmployees}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均得分</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.avgScore}分</div>
              <p className="text-xs text-muted-foreground">
                {overview.avgScore >= 80 ? '绩效表现优异' : '绩效表现一般'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">优秀率</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview.totalEmployees > 0
                  ? Math.round((overview.excellent / overview.totalEmployees) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">{overview.excellent} 人评级为优秀</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待改进</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview.totalEmployees > 0
                  ? Math.round((overview.poor / overview.totalEmployees) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">{overview.poor} 人需制定改进计划</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>部门绩效排名</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={deptRanking}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="departmentName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#8884d8" name="平均分" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>绩效趋势分析</CardTitle>
            <CardDescription>最近6个考核周期的平均分变化</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="avgScore" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
