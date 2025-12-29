import React, { useEffect, useState, useCallback, memo } from 'react';
import { Users, Calendar, Play, Check, Edit3, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { calibrationApi, CalibrationSession, CalibrationAdjustment } from '@/api/calibration.api';
import { assessmentApi } from '@/api/assessment.api';
import { AssessmentPeriod } from '@/types';
import { cn } from '@/lib/utils';
import { TableRowSkeleton } from '@/components/ui/skeleton';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-slate-100 text-slate-600' },
  in_progress: { label: '进行中', color: 'bg-amber-100 text-amber-700' },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700' },
};

const GRADE_COLORS: Record<string, string> = {
  S: 'bg-purple-500', A: 'bg-emerald-500', B: 'bg-blue-500', C: 'bg-amber-500', D: 'bg-red-500',
};

export const CalibrationView: React.FC = memo(() => {
  const { toast } = useToast();
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [sessions, setSessions] = useState<CalibrationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [selectedSession, setSelectedSession] = useState<CalibrationSession | null>(null);
  const [adjustments, setAdjustments] = useState<CalibrationAdjustment[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState<string>('');
  const [editReason, setEditReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadPeriods = useCallback(async () => {
    try {
      const response = await assessmentApi.getPeriods();
      setPeriods(response.data || []);
      if (response.data?.length > 0) setSelectedPeriod(response.data[0].id);
    } catch { toast({ variant: 'destructive', title: '加载考核周期失败' }); }
  }, [toast]);

  const loadSessions = useCallback(async () => {
    if (!selectedPeriod) return;
    setLoading(true);
    try {
      const data = await calibrationApi.getSessions(selectedPeriod);
      setSessions(data || []);
    } catch { toast({ variant: 'destructive', title: '加载校准会话失败' }); }
    finally { setLoading(false); }
  }, [selectedPeriod, toast]);

  const loadSessionDetail = useCallback(async (session: CalibrationSession) => {
    try {
      const data = await calibrationApi.getSessionDetail(session.id);
      setSelectedSession(data);
      setAdjustments(data.adjustments || []);
    } catch { toast({ variant: 'destructive', title: '加载详情失败' }); }
  }, [toast]);

  useEffect(() => { loadPeriods(); }, [loadPeriods]);
  useEffect(() => { loadSessions(); }, [loadSessions]);

  const handleCreateSession = async () => {
    if (!sessionName.trim() || !selectedPeriod) return;
    setProcessing(true);
    try {
      await calibrationApi.createSession({ periodId: selectedPeriod, name: sessionName });
      toast({ title: '校准会话已创建' });
      setCreateDialogOpen(false);
      setSessionName('');
      loadSessions();
    } catch { toast({ variant: 'destructive', title: '创建失败' }); }
    finally { setProcessing(false); }
  };

  const handleSaveAdjustment = async (adj: CalibrationAdjustment) => {
    if (!editScore || !selectedSession) return;
    setProcessing(true);
    try {
      await calibrationApi.adjustScore(selectedSession.id, {
        employeeId: adj.employeeId,
        adjustedScore: parseFloat(editScore),
        reason: editReason || undefined,
      });
      toast({ title: '调整已保存' });
      setEditingId(null);
      loadSessionDetail(selectedSession);
    } catch { toast({ variant: 'destructive', title: '保存失败' }); }
    finally { setProcessing(false); }
  };

  const startEdit = (adj: CalibrationAdjustment) => {
    setEditingId(adj.id);
    setEditScore(adj.adjustedScore.toString());
    setEditReason(adj.reason || '');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">绩效校准</h1>
          <p className="text-slate-500">校准会议管理与分数调整</p>
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
          <Button onClick={() => setCreateDialogOpen(true)}><Play className="w-4 h-4 mr-2" />新建校准</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />校准会话</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />)}</div>
            ) : sessions.length === 0 ? (
              <p className="text-center text-slate-500 py-8">暂无校准会话</p>
            ) : (
              <div className="space-y-2">
                {sessions.map(session => {
                  const statusInfo = STATUS_MAP[session.status] || STATUS_MAP.draft;
                  return (
                    <div
                      key={session.id}
                      onClick={() => loadSessionDetail(session)}
                      className={cn('p-3 rounded-lg border cursor-pointer transition-colors', selectedSession?.id === session.id ? 'border-primary bg-primary/5' : 'hover:bg-slate-50')}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{session.name}</span>
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{new Date(session.createdAt).toLocaleDateString()}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>调整记录</CardTitle></CardHeader>
          <CardContent>
            {!selectedSession ? (
              <p className="text-center text-slate-500 py-12">请选择一个校准会话</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>员工</TableHead>
                    <TableHead>原始分数</TableHead>
                    <TableHead>调整后分数</TableHead>
                    <TableHead>等级变化</TableHead>
                    <TableHead>原因</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustments.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">暂无调整记录</TableCell></TableRow>
                  ) : (
                    adjustments.map(adj => (
                      <TableRow key={adj.id}>
                        <TableCell>
                          <div className="font-medium">{adj.employee?.name}</div>
                          <div className="text-xs text-slate-500">{adj.employee?.department?.name}</div>
                        </TableCell>
                        <TableCell>{adj.originalScore}</TableCell>
                        <TableCell>
                          {editingId === adj.id ? (
                            <Input type="number" min="0" max="100" value={editScore} onChange={e => setEditScore(e.target.value)} className="w-20" />
                          ) : (
                            <span className={cn(adj.adjustedScore > adj.originalScore ? 'text-emerald-600' : adj.adjustedScore < adj.originalScore ? 'text-red-600' : '')}>{adj.adjustedScore}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {adj.originalGrade && <span className={cn('w-6 h-6 rounded text-white text-xs flex items-center justify-center', GRADE_COLORS[adj.originalGrade])}>{adj.originalGrade}</span>}
                            <span className="text-slate-400">→</span>
                            {adj.adjustedGrade && <span className={cn('w-6 h-6 rounded text-white text-xs flex items-center justify-center', GRADE_COLORS[adj.adjustedGrade])}>{adj.adjustedGrade}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingId === adj.id ? (
                            <Input value={editReason} onChange={e => setEditReason(e.target.value)} placeholder="调整原因" className="w-32" />
                          ) : (
                            <span className="text-sm text-slate-600">{adj.reason || '-'}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingId === adj.id ? (
                            <Button size="sm" onClick={() => handleSaveAdjustment(adj)} disabled={processing}><Save className="w-4 h-4" /></Button>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => startEdit(adj)}><Edit3 className="w-4 h-4" /></Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新建校准会话</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">会话名称</label>
              <Input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="例如: 2024Q4销售部校准" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreateSession} disabled={processing || !sessionName.trim()}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

CalibrationView.displayName = 'CalibrationView';
