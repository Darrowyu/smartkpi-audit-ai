import React, { useEffect, useState, useCallback, memo } from 'react';
import { ClipboardCheck, Calendar, AlertTriangle, TrendingUp, Plus, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { checkinApi, ProgressCheckIn, RiskAlert } from '@/api/checkin.api';
import { assessmentApi } from '@/api/assessment.api';
import { AssessmentPeriod } from '@/types';
import { cn } from '@/lib/utils';
import { TableRowSkeleton } from '@/components/ui/skeleton';

const RISK_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700' },
  high: { bg: 'bg-red-100', text: 'text-red-700' },
};

export const CheckInView: React.FC = memo(() => {
  const { toast } = useToast();
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [checkIns, setCheckIns] = useState<ProgressCheckIn[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [progress, setProgress] = useState<number>(0);
  const [blockers, setBlockers] = useState('');
  const [achievements, setAchievements] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [riskLevel, setRiskLevel] = useState<string>('low');
  const [processing, setProcessing] = useState(false);

  const loadPeriods = useCallback(async () => {
    try {
      const response = await assessmentApi.getPeriods();
      setPeriods(response.data || []);
      if (response.data?.length > 0) setSelectedPeriod(response.data[0].id);
    } catch { toast({ variant: 'destructive', title: '加载考核周期失败' }); }
  }, [toast]);

  const loadCheckIns = useCallback(async () => {
    if (!selectedPeriod) return;
    setLoading(true);
    try {
      const [checkInData, riskData] = await Promise.all([
        checkinApi.getCheckIns(selectedPeriod),
        checkinApi.getRiskAlerts(selectedPeriod),
      ]);
      setCheckIns(checkInData || []);
      setRiskAlerts(riskData || []);
    } catch { toast({ variant: 'destructive', title: '加载数据失败' }); }
    finally { setLoading(false); }
  }, [selectedPeriod, toast]);

  useEffect(() => { loadPeriods(); }, [loadPeriods]);
  useEffect(() => { loadCheckIns(); }, [loadCheckIns]);

  const handleCreate = async () => {
    if (!employeeId || !selectedPeriod) return;
    setProcessing(true);
    try {
      await checkinApi.createCheckIn({
        periodId: selectedPeriod,
        employeeId,
        progressPercentage: progress,
        blockers: blockers || undefined,
        achievements: achievements || undefined,
        nextSteps: nextSteps || undefined,
        riskLevel,
      });
      toast({ title: '检查点已创建' });
      setCreateDialogOpen(false);
      resetForm();
      loadCheckIns();
    } catch { toast({ variant: 'destructive', title: '创建失败' }); }
    finally { setProcessing(false); }
  };

  const resetForm = () => {
    setEmployeeId('');
    setProgress(0);
    setBlockers('');
    setAchievements('');
    setNextSteps('');
    setRiskLevel('low');
  };

  const highRiskCount = riskAlerts.filter(r => r.riskLevel === 'high').length;
  const avgProgress = checkIns.length > 0 ? Math.round(checkIns.reduce((sum, c) => sum + c.progressPercentage, 0) / checkIns.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">进度检查点</h1>
          <p className="text-slate-500">跟踪员工绩效进度与风险预警</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[200px]">
              <Calendar className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="选择考核周期" />
            </SelectTrigger>
            <SelectContent>
              {periods.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />新建检查点</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-blue-600">{checkIns.length}</div><p className="text-sm text-slate-500">检查点数</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-emerald-600">{avgProgress}%</div><p className="text-sm text-slate-500">平均进度</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-red-600">{highRiskCount}</div><p className="text-sm text-slate-500">高风险</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-amber-600">{riskAlerts.length}</div><p className="text-sm text-slate-500">风险预警</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="w-5 h-5" />检查点记录</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>员工</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>进度</TableHead>
                  <TableHead>风险</TableHead>
                  <TableHead>成果</TableHead>
                  <TableHead>阻碍</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} columns={6} />)
                ) : checkIns.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500">暂无检查点记录</TableCell></TableRow>
                ) : (
                  checkIns.map(checkIn => {
                    const riskColor = RISK_COLORS[checkIn.riskLevel] || RISK_COLORS.low;
                    return (
                      <TableRow key={checkIn.id}>
                        <TableCell>
                          <div className="font-medium">{checkIn.employee?.name || '-'}</div>
                          <div className="text-xs text-slate-500">{checkIn.employee?.department?.name}</div>
                        </TableCell>
                        <TableCell>{new Date(checkIn.checkInDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={checkIn.progressPercentage} className="w-16 h-2" />
                            <span className="text-sm">{checkIn.progressPercentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge className={cn(riskColor.bg, riskColor.text)}>{checkIn.riskLevel === 'high' ? '高' : checkIn.riskLevel === 'medium' ? '中' : '低'}</Badge></TableCell>
                        <TableCell className="max-w-[150px] truncate" title={checkIn.achievements || ''}>{checkIn.achievements || '-'}</TableCell>
                        <TableCell className="max-w-[150px] truncate" title={checkIn.blockers || ''}>{checkIn.blockers || '-'}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" />风险预警</CardTitle></CardHeader>
          <CardContent>
            {riskAlerts.length === 0 ? (
              <p className="text-center text-slate-500 py-8">暂无风险预警</p>
            ) : (
              <div className="space-y-3">
                {riskAlerts.map((alert, idx) => {
                  const riskColor = RISK_COLORS[alert.riskLevel] || RISK_COLORS.low;
                  return (
                    <div key={idx} className={cn('p-3 rounded-lg border', riskColor.bg)}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{alert.employee?.name}</span>
                        <Badge className={cn(riskColor.bg, riskColor.text)}>{alert.riskLevel === 'high' ? '高风险' : '中风险'}</Badge>
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        <div>进度: {alert.progressPercentage}%</div>
                        <div>距上次检查: {alert.daysSinceLastCheckIn}天</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>新建检查点</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">员工ID *</label>
              <Input value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="请输入员工ID" />
            </div>
            <div>
              <label className="text-sm font-medium">完成进度 ({progress}%)</label>
              <Input type="range" min="0" max="100" value={progress} onChange={e => setProgress(parseInt(e.target.value))} />
            </div>
            <div>
              <label className="text-sm font-medium">风险等级</label>
              <Select value={riskLevel} onValueChange={setRiskLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低风险</SelectItem>
                  <SelectItem value="medium">中风险</SelectItem>
                  <SelectItem value="high">高风险</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">主要成果</label>
              <Textarea value={achievements} onChange={e => setAchievements(e.target.value)} placeholder="本阶段主要成果..." rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium">遇到阻碍</label>
              <Textarea value={blockers} onChange={e => setBlockers(e.target.value)} placeholder="遇到的问题或阻碍..." rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium">下一步计划</label>
              <Textarea value={nextSteps} onChange={e => setNextSteps(e.target.value)} placeholder="接下来的工作计划..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetForm(); }}>取消</Button>
            <Button onClick={handleCreate} disabled={processing || !employeeId}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

CheckInView.displayName = 'CheckInView';
