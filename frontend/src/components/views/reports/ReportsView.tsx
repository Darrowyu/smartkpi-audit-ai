import React, { useEffect, useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, Download, History, Plus, Upload, RefreshCw, Building2 } from 'lucide-react';
import { Language, AssessmentPeriod } from '@/types';
import { assessmentApi } from '@/api/assessment.api';
import { reportsApi, PerformanceOverview, DepartmentRanking, TrendData } from '@/api/reports.api';
import { useToast } from '@/components/ui/use-toast';
import { PerformanceOverviewCards } from './PerformanceOverviewCards';
import { EmployeeRankingTable } from './EmployeeRankingTable';
import { LowPerformanceAlertPanel } from './LowPerformanceAlertPanel';
import { PerformanceTrendChart } from './PerformanceTrendChart';

interface ReportsViewProps {
  language: Language;
  onFileSelect?: (file: File, period: string) => void;
  isProcessing?: boolean;
  error?: string | null;
}

export const ReportsView: React.FC<ReportsViewProps> = memo(({ language }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [overview, setOverview] = useState<PerformanceOverview | null>(null);
  const [deptRanking, setDeptRanking] = useState<DepartmentRanking[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPeriods = useCallback(async () => { // 加载考核周期
    try {
      const res = await assessmentApi.getPeriods();
      const data = res.data || res || [];
      setPeriods(data);
      if (data.length > 0) setSelectedPeriod(data[0].id);
    } catch { /* 静默处理 */ }
  }, []);

  const loadReportData = useCallback(async () => { // 加载报表数据
    if (!selectedPeriod) return;
    setLoading(true);
    try {
      const [ov, dept, trend] = await Promise.all([
        reportsApi.getOverview(selectedPeriod),
        reportsApi.getDepartmentRanking(selectedPeriod),
        reportsApi.getTrend(),
      ]);
      setOverview(ov);
      setDeptRanking(dept);
      setTrendData(trend);
    } catch { /* 静默处理 */ }
    finally { setLoading(false); }
  }, [selectedPeriod]);

  useEffect(() => { loadPeriods(); }, [loadPeriods]);
  useEffect(() => { loadReportData(); }, [loadReportData]);

  const handleExport = async (type: 'employees' | 'departments') => { // 导出报表
    if (!selectedPeriod) return;
    try {
      const blob = type === 'employees'
        ? await reportsApi.exportEmployees(selectedPeriod, 'xlsx')
        : await reportsApi.exportDepartments(selectedPeriod, 'xlsx');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type === 'employees' ? 'Employee' : 'Department'}_Report_${overview?.periodName || 'export'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ title: t('reports.exportSuccess', '导出成功') });
    } catch {
      toast({ variant: 'destructive', title: t('reports.exportFailed', '导出失败') });
    }
  };

  const handleDownloadSample = () => { // 下载样本模板
    const sampleData = `员工姓名,部门,职位,销售额,客户满意度,项目完成率,出勤率
张三,销售部,销售经理,150000,95,100,98
李四,销售部,销售代表,85000,88,90,96
王五,技术部,开发工程师,0,92,95,100
赵六,技术部,测试工程师,0,90,88,99`;
    const blob = new Blob(['\ufeff' + sampleData], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'KPI_Sample_Template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    toast({ title: t('reports.sampleDownloaded', '样本模板已下载') });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('reports.title', '绩效报表')}</h2>
          <p className="text-muted-foreground">{t('reports.subtitle', '查看和分析员工绩效数据')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('reports.selectPeriod', '选择考核周期')} />
            </SelectTrigger>
            <SelectContent>
              {periods.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => loadReportData()}>
            <RefreshCw className="mr-2 h-4 w-4" />{t('refresh', '刷新')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="dashboard">{t('reports.dashboard', '仪表盘')}</TabsTrigger>
          <TabsTrigger value="ranking">{t('reports.ranking', '排名')}</TabsTrigger>
          <TabsTrigger value="upload">{t('reports.aiAnalysis', 'AI分析')}</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <PerformanceOverviewCards data={overview} loading={loading} />

          <div className="grid gap-6 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {t('reports.deptRanking', '部门排名')}
                </CardTitle>
                <CardDescription>{t('reports.deptRankingDesc', '各部门平均绩效得分')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={deptRanking}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="departmentName" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} name={t('reports.avgScore')} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="lg:col-span-3">
              <LowPerformanceAlertPanel periodId={selectedPeriod} threshold={60} maxItems={5} />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('reports.trendAnalysis', '趋势分析')}</CardTitle>
              <CardDescription>{t('reports.trendAnalysisDesc', '近期考核周期绩效走势')}</CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceTrendChart data={trendData} />
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => handleExport('departments')}>
              <Download className="mr-2 h-4 w-4" />{t('reports.exportDept', '导出部门报表')}
            </Button>
            <Button onClick={() => handleExport('employees')}>
              <Download className="mr-2 h-4 w-4" />{t('reports.exportEmployee', '导出员工报表')}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="ranking" className="mt-6">
          <EmployeeRankingTable periodId={selectedPeriod} pageSize={15} />
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mx-auto mb-4">
                <FileText className="w-8 h-8 text-indigo-600" />
              </div>
              <CardTitle>{t('reports.aiUploadTitle', 'AI智能分析')}</CardTitle>
              <CardDescription>{t('reports.aiUploadDesc', '上传Excel文件，使用AI进行绩效分析')}</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/upload')}>
                  <Upload className="mr-2 h-5 w-5" />{t('reports.uploadForAnalysis', '上传文件分析')}
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/history')}>
                  <History className="mr-2 h-5 w-5" />{t('reports.viewHistory', '查看历史分析')}
                </Button>
              </div>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-4 border-t">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{t('reports.supportedFormats', '支持 .xlsx, .csv 格式')}</span>
                </div>
                <span>•</span>
                <button onClick={handleDownloadSample} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium">
                  <Download className="w-4 h-4" /><span>{t('reports.downloadSample', '下载样本模板')}</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

ReportsView.displayName = 'ReportsView';
