import React, { useEffect, useState, useCallback, memo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Calendar, User, Loader2, TrendingUp, Users, Trophy, AlertTriangle, ChevronRight, Download, Sparkles, X, Target, Star, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { kpiAnalysisApi, KPIAnalysis } from '@/api/kpi-analysis.api';
import { useToast } from '@/components/ui/use-toast';

interface Metric {
    name: string;
    score: number;
    actualValue: string;
    targetValue: string;
    weight: number;
    comment: string;
}

interface EmployeeKPI {
    name: string;
    department: string;
    role: string;
    totalScore: number;
    status: string;
    aiAnalysis?: string;
    strengths?: string[];
    improvements?: string[];
    metrics?: Metric[];
}

interface ExtendedResult {
    summary?: string;
    period?: string;
    employees?: EmployeeKPI[];
}

const statusConfig: Record<string, { label: string; color: string }> = {
    Excellent: { label: '优秀', color: '#22c55e' },
    Good: { label: '良好', color: '#3b82f6' },
    Average: { label: '合格', color: '#f59e0b' },
    Poor: { label: '待改进', color: '#ef4444' },
};

export const AnalysisDetailView: React.FC = memo(() => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { toast } = useToast();
    const [analysis, setAnalysis] = useState<KPIAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeKPI | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    const loadAnalysis = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await kpiAnalysisApi.getAnalysis(id);
            setAnalysis(data);
        } catch {
            toast({ variant: 'destructive', title: t('analysis.loadFailed', '加载失败') });
        } finally {
            setLoading(false);
        }
    }, [id, toast, t]);

    useEffect(() => { loadAnalysis(); }, [loadAnalysis]);

    const handleExportPDF = async () => {
        if (!analysis) return;
        setExporting(true);
        try {
            const [{ pdf }, { AnalysisPDFDocument }] = await Promise.all([
                import('@react-pdf/renderer'),
                import('./AnalysisPDFDocument')
            ]); // 动态导入PDF库
            const pdfBlob = await pdf(
                <AnalysisPDFDocument
                    fileName={analysis.file.originalName}
                    period={analysis.period}
                    createdAt={formatDate(analysis.createdAt)}
                    summary={analysis.summary || result?.summary || ''}
                    employees={employees}
                />
            ).toBlob();
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `KPI_Analysis_${analysis.period}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast({ title: t('analysis.exportSuccess', 'PDF导出成功') });
        } catch (e) {
            console.error('PDF export error:', e);
            toast({ variant: 'destructive', title: t('analysis.exportFailed', '导出失败') });
        } finally {
            setExporting(false);
        }
    };

    const formatDate = (dateStr: string) => new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateStr));

    if (loading) return (<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>);

    if (!analysis) {
        return (
            <div className="text-center py-16">
                <p className="text-muted-foreground">{t('analysis.notFound', '未找到分析记录')}</p>
                <Button variant="link" onClick={() => navigate('/history')} className="mt-4">{t('analysis.backToHistory', '返回历史记录')}</Button>
            </div>
        );
    }

    const result = analysis.rawResult as ExtendedResult | undefined;
    const employees = result?.employees || [];
    const teamAvg = employees.length > 0 ? (employees.reduce((sum, e) => sum + e.totalScore, 0) / employees.length).toFixed(1) : '0';
    const topPerformer = employees.length > 0 ? employees.reduce((a, b) => a.totalScore > b.totalScore ? a : b) : null;
    const needsImprovement = employees.length > 0 ? employees.reduce((a, b) => a.totalScore < b.totalScore ? a : b) : null;
    const performanceData = employees.map(e => ({ name: e.name, score: e.totalScore }));
    const ratingCounts = employees.reduce((acc, e) => { acc[e.status] = (acc[e.status] || 0) + 1; return acc; }, {} as Record<string, number>);
    const pieData = Object.entries(ratingCounts).map(([status, count]) => ({ name: statusConfig[status]?.label || status, value: count, color: statusConfig[status]?.color || '#94a3b8' }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/history')} aria-label="返回历史记录"><ArrowLeft className="h-5 w-5" /></Button>
                    <div>
                        <h2 className="text-2xl font-bold">{analysis.file.originalName}</h2>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(analysis.createdAt)}</span>
                            <span className="flex items-center gap-1"><User className="h-4 w-4" />{analysis.analyzedBy.firstName || analysis.analyzedBy.email}</span>
                            <Badge variant="secondary">{analysis.period}</Badge>
                        </div>
                    </div>
                </div>
                <Button onClick={handleExportPDF} disabled={exporting}>
                    <Download className="mr-2 h-4 w-4" />{exporting ? t('analysis.exporting', '导出中...') : t('analysis.exportPDF', '导出PDF')}
                </Button>
            </div>

            <div ref={reportRef} className="space-y-6 bg-white p-6 rounded-xl">
                <Card className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 border-0 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3 mb-3">
                            <Badge className="bg-indigo-600 text-white"><Sparkles className="h-3 w-3 mr-1" />AI Insights</Badge>
                            <span className="font-semibold text-lg text-slate-800">Executive Summary</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{analysis.summary || result?.summary}</p>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-slate-200"><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Team Avg</p><p className="text-3xl font-bold text-slate-900">{teamAvg}<span className="text-lg text-slate-400">%</span></p></div><TrendingUp className="h-8 w-8 text-slate-300" /></div></CardContent></Card>
                    <Card className="border-slate-200"><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Total Employees</p><p className="text-3xl font-bold text-slate-900">{employees.length}</p></div><Users className="h-8 w-8 text-slate-300" /></div></CardContent></Card>
                    <Card className="border-slate-200 bg-green-50/50"><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Top Performer</p><p className="text-xl font-bold text-green-700">{topPerformer?.name || '-'}<span className="text-sm text-green-500 ml-1">({topPerformer?.totalScore}%)</span></p></div><Trophy className="h-8 w-8 text-green-300" /></div></CardContent></Card>
                    <Card className="border-slate-200 bg-yellow-50/50"><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Needs Improvement</p><p className="text-xl font-bold text-yellow-700">{needsImprovement?.name || '-'}<span className="text-sm text-yellow-500 ml-1">({needsImprovement?.totalScore}%)</span></p></div><AlertTriangle className="h-8 w-8 text-yellow-300" /></div></CardContent></Card>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    <Card><CardHeader className="pb-2"><CardTitle className="text-lg font-semibold">Performance Distribution</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={280}><BarChart data={performanceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis domain={[0, 130]} tick={{ fontSize: 12 }} /><Tooltip formatter={(value: number) => [`${value}%`, '得分']} /><Bar dataKey="score" fill="#22c55e" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-lg font-semibold">Rating Breakdown</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>{pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Legend verticalAlign="bottom" height={36} /><Tooltip /></PieChart></ResponsiveContainer></CardContent></Card>
                </div>

                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-lg font-semibold">Detailed Records</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {employees.map((emp, idx) => {
                                const status = statusConfig[emp.status] || statusConfig.Average;
                                return (
                                    <div key={idx} onClick={() => setSelectedEmployee(emp)} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center text-white font-semibold">{emp.name.charAt(0)}</div>
                                            <div><p className="font-semibold text-slate-900">{emp.name}</p><p className="text-xs text-slate-500">{emp.role}</p></div>
                                        </div>
                                        <div className="text-sm text-slate-500">{emp.department}</div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400">{emp.metrics?.length || 0}</span>
                                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(emp.totalScore, 100)}%`, backgroundColor: status.color }} /></div>
                                            <span className="font-bold text-slate-900 w-16 text-right">{emp.totalScore}%</span>
                                        </div>
                                        <Badge className="text-xs" style={{ backgroundColor: `${status.color}20`, color: status.color, border: `1px solid ${status.color}30` }}>{status.label}</Badge>
                                        <ChevronRight className="h-5 w-5 text-slate-300" />
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {selectedEmployee && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }} onClick={() => setSelectedEmployee(null)}>
                    <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-cyan-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">{selectedEmployee.name.charAt(0)}</div>
                                    <div>
                                        <CardTitle className="text-2xl">{selectedEmployee.name}</CardTitle>
                                        <CardDescription className="text-base">{selectedEmployee.department} · {selectedEmployee.role}</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right"><div className="text-4xl font-bold" style={{ color: statusConfig[selectedEmployee.status]?.color }}>{selectedEmployee.totalScore}%</div><Badge style={{ backgroundColor: `${statusConfig[selectedEmployee.status]?.color}20`, color: statusConfig[selectedEmployee.status]?.color }}>{statusConfig[selectedEmployee.status]?.label}</Badge></div>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedEmployee(null)} aria-label="关闭详情"><X className="h-5 w-5" /></Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {selectedEmployee.aiAnalysis && (
                                <Card className="bg-slate-50 border-slate-200">
                                    <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-500" />AI 绩效分析</CardTitle></CardHeader>
                                    <CardContent><p className="text-slate-700 leading-relaxed">{selectedEmployee.aiAnalysis}</p></CardContent>
                                </Card>
                            )}

                            <div className="grid md:grid-cols-2 gap-4">
                                {selectedEmployee.strengths && selectedEmployee.strengths.length > 0 && (
                                    <Card className="border-green-200 bg-green-50/50">
                                        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 text-green-700"><Star className="h-4 w-4" />优势亮点</CardTitle></CardHeader>
                                        <CardContent><ul className="space-y-2">{selectedEmployee.strengths.map((s, i) => (<li key={i} className="flex items-start gap-2 text-sm text-green-800"><TrendingUp className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />{s}</li>))}</ul></CardContent>
                                    </Card>
                                )}
                                {selectedEmployee.improvements && selectedEmployee.improvements.length > 0 && (
                                    <Card className="border-orange-200 bg-orange-50/50">
                                        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 text-orange-700"><Target className="h-4 w-4" />待改进项</CardTitle></CardHeader>
                                        <CardContent><ul className="space-y-2">{selectedEmployee.improvements.map((s, i) => (<li key={i} className="flex items-start gap-2 text-sm text-orange-800"><TrendingDown className="h-4 w-4 mt-0.5 text-orange-600 flex-shrink-0" />{s}</li>))}</ul></CardContent>
                                    </Card>
                                )}
                            </div>

                            {selectedEmployee.metrics && selectedEmployee.metrics.length > 0 && (
                                <div className="grid lg:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader className="pb-2"><CardTitle className="text-base">指标雷达图</CardTitle></CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <RadarChart data={selectedEmployee.metrics.map(m => ({ subject: m.name, score: m.score, fullMark: 120 }))}>
                                                    <PolarGrid /><PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} /><PolarRadiusAxis angle={30} domain={[0, 120]} />
                                                    <Radar name="得分" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2"><CardTitle className="text-base">指标明细</CardTitle></CardHeader>
                                        <CardContent className="p-0">
                                            <Table>
                                                <TableHeader><TableRow><TableHead>指标</TableHead><TableHead className="text-right">目标</TableHead><TableHead className="text-right">实际</TableHead><TableHead className="text-right">得分</TableHead><TableHead className="text-right">权重</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                    {selectedEmployee.metrics.map((m, i) => (
                                                        <TableRow key={i} className="hover:bg-slate-50">
                                                            <TableCell className="font-medium">{m.name}</TableCell>
                                                            <TableCell className="text-right text-slate-500">{m.targetValue}</TableCell>
                                                            <TableCell className="text-right">{m.actualValue}</TableCell>
                                                            <TableCell className="text-right font-bold" style={{ color: m.score >= 90 ? '#22c55e' : m.score >= 60 ? '#f59e0b' : '#ef4444' }}>{m.score}</TableCell>
                                                            <TableCell className="text-right text-slate-500">{m.weight}%</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {selectedEmployee.metrics && selectedEmployee.metrics.some(m => m.comment) && (
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-base">指标评语</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {selectedEmployee.metrics.filter(m => m.comment).map((m, i) => (
                                                <div key={i} className="p-3 bg-slate-50 rounded-lg border">
                                                    <p className="font-medium text-slate-900 text-sm mb-1">{m.name}</p>
                                                    <p className="text-slate-600 text-sm">{m.comment}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </CardContent>
                    </Card>
                </div>
                , document.body)}
        </div>
    );
});

AnalysisDetailView.displayName = 'AnalysisDetailView';
