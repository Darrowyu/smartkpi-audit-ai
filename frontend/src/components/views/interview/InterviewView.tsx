import React, { useEffect, useState, useCallback, memo } from 'react';
import { MessageSquare, Calendar, User, Clock, CheckCircle, XCircle, Plus, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { interviewApi, PerformanceInterview } from '@/api/interview.api';
import { assessmentApi } from '@/api/assessment.api';
import { AssessmentPeriod } from '@/types';
import { cn } from '@/lib/utils';
import { TableRowSkeleton } from '@/components/ui/skeleton';

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  scheduled: { label: '已安排', color: 'bg-blue-100 text-blue-700', icon: <Clock className="w-3 h-3" /> },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: '已取消', color: 'bg-slate-100 text-slate-600', icon: <XCircle className="w-3 h-3" /> },
};

export const InterviewView: React.FC = memo(() => {
  const { toast } = useToast();
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [interviews, setInterviews] = useState<PerformanceInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [conductDialogOpen, setConductDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<PerformanceInterview | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [summary, setSummary] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadPeriods = useCallback(async () => {
    try {
      const response = await assessmentApi.getPeriods();
      setPeriods(response.data || []);
      if (response.data?.length > 0) setSelectedPeriod(response.data[0].id);
    } catch { toast({ variant: 'destructive', title: '加载考核周期失败' }); }
  }, [toast]);

  const loadInterviews = useCallback(async () => {
    if (!selectedPeriod) return;
    setLoading(true);
    try {
      const data = await interviewApi.getInterviews(selectedPeriod);
      setInterviews(data || []);
    } catch { toast({ variant: 'destructive', title: '加载面谈列表失败' }); }
    finally { setLoading(false); }
  }, [selectedPeriod, toast]);

  useEffect(() => { loadPeriods(); }, [loadPeriods]);
  useEffect(() => { loadInterviews(); }, [loadInterviews]);

  const handleSchedule = async () => {
    if (!employeeId || !scheduledAt || !selectedPeriod) return;
    setProcessing(true);
    try {
      await interviewApi.scheduleInterview({ periodId: selectedPeriod, employeeId, scheduledAt });
      toast({ title: '面谈已安排' });
      setScheduleDialogOpen(false);
      setEmployeeId('');
      setScheduledAt('');
      loadInterviews();
    } catch { toast({ variant: 'destructive', title: '安排失败' }); }
    finally { setProcessing(false); }
  };

  const handleConduct = async () => {
    if (!selectedInterview || !summary.trim()) return;
    setProcessing(true);
    try {
      await interviewApi.conductInterview(selectedInterview.id, { summary, actionItems: actionItems || undefined });
      toast({ title: '面谈记录已保存' });
      setConductDialogOpen(false);
      setSummary('');
      setActionItems('');
      loadInterviews();
    } catch { toast({ variant: 'destructive', title: '保存失败' }); }
    finally { setProcessing(false); }
  };

  const openConductDialog = (interview: PerformanceInterview) => {
    setSelectedInterview(interview);
    setSummary(interview.summary || '');
    setActionItems(interview.actionItems || '');
    setConductDialogOpen(true);
  };

  const scheduledCount = interviews.filter(i => i.status === 'scheduled').length;
  const completedCount = interviews.filter(i => i.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">绩效面谈</h1>
          <p className="text-slate-500">安排和记录绩效面谈</p>
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
          <Button onClick={() => setScheduleDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />安排面谈</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-blue-600">{scheduledCount}</div><p className="text-sm text-slate-500">待进行</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-emerald-600">{completedCount}</div><p className="text-sm text-slate-500">已完成</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-amber-600">{interviews.filter(i => i.status === 'completed' && !i.employeeConfirmed).length}</div><p className="text-sm text-slate-500">待确认</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-slate-600">{interviews.length}</div><p className="text-sm text-slate-500">总数</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" />面谈记录</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>员工</TableHead>
                <TableHead>面谈人</TableHead>
                <TableHead>计划时间</TableHead>
                <TableHead>实际时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>员工确认</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} columns={7} />)
              ) : interviews.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-500">暂无面谈记录</TableCell></TableRow>
              ) : (
                interviews.map(interview => {
                  const statusInfo = STATUS_MAP[interview.status] || STATUS_MAP.scheduled;
                  return (
                    <TableRow key={interview.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="font-medium">{interview.employee?.name || '-'}</div>
                            <div className="text-xs text-slate-500">{interview.employee?.department?.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{interview.interviewerName || interview.interviewer?.username || '-'}</TableCell>
                      <TableCell>{interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleString() : '-'}</TableCell>
                      <TableCell>{interview.conductedAt ? new Date(interview.conductedAt).toLocaleString() : '-'}</TableCell>
                      <TableCell><Badge className={cn('gap-1', statusInfo.color)}>{statusInfo.icon}{statusInfo.label}</Badge></TableCell>
                      <TableCell>
                        {interview.employeeConfirmed ? (
                          <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3 mr-1" />已确认</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600">待确认</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {interview.status === 'scheduled' && (
                          <Button size="sm" variant="outline" onClick={() => openConductDialog(interview)}><FileText className="w-4 h-4 mr-1" />记录</Button>
                        )}
                        {interview.status === 'completed' && (
                          <Button size="sm" variant="ghost" onClick={() => openConductDialog(interview)}><FileText className="w-4 h-4" /></Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>安排面谈</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">员工ID</label>
              <Input value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="请输入员工ID" />
            </div>
            <div>
              <label className="text-sm font-medium">面谈时间</label>
              <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>取消</Button>
            <Button onClick={handleSchedule} disabled={processing || !employeeId || !scheduledAt}>确认安排</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={conductDialogOpen} onOpenChange={setConductDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>面谈记录</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">面谈摘要 *</label>
              <Textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="请输入面谈主要内容..." rows={4} />
            </div>
            <div>
              <label className="text-sm font-medium">行动计划</label>
              <Textarea value={actionItems} onChange={e => setActionItems(e.target.value)} placeholder="请输入后续行动计划..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConductDialogOpen(false)}>取消</Button>
            <Button onClick={handleConduct} disabled={processing || !summary.trim()}>保存记录</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

InterviewView.displayName = 'InterviewView';
