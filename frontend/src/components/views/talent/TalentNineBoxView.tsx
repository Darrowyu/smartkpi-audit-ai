import React, { useEffect, useState, useCallback, memo } from 'react';
import { Grid3X3, Calendar, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { talentApi, NineBoxData, TalentAssessment } from '@/api/talent.api';
import { assessmentApi } from '@/api/assessment.api';
import { AssessmentPeriod } from '@/types';
import { cn } from '@/lib/utils';

const GRID_CONFIG = [
  { position: 'high_low', label: '待开发', row: 0, col: 0, color: 'bg-amber-100 border-amber-300' },
  { position: 'high_mid', label: '成长之星', row: 0, col: 1, color: 'bg-blue-100 border-blue-300' },
  { position: 'high_high', label: '明星员工', row: 0, col: 2, color: 'bg-emerald-100 border-emerald-300' },
  { position: 'mid_low', label: '需关注', row: 1, col: 0, color: 'bg-red-100 border-red-300' },
  { position: 'mid_mid', label: '核心员工', row: 1, col: 1, color: 'bg-slate-100 border-slate-300' },
  { position: 'mid_high', label: '绩效之星', row: 1, col: 2, color: 'bg-cyan-100 border-cyan-300' },
  { position: 'low_low', label: '待决策', row: 2, col: 0, color: 'bg-red-200 border-red-400' },
  { position: 'low_mid', label: '待改进', row: 2, col: 1, color: 'bg-amber-200 border-amber-400' },
  { position: 'low_high', label: '专业贡献者', row: 2, col: 2, color: 'bg-purple-100 border-purple-300' },
];

export const TalentNineBoxView: React.FC = memo(() => {
  const { toast } = useToast();
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [nineBoxData, setNineBoxData] = useState<NineBoxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  const loadPeriods = useCallback(async () => {
    try {
      const response = await assessmentApi.getPeriods();
      setPeriods(response.data || []);
      if (response.data?.length > 0) setSelectedPeriod(response.data[0].id);
    } catch { toast({ variant: 'destructive', title: '加载考核周期失败' }); }
  }, [toast]);

  const loadNineBoxData = useCallback(async () => {
    if (!selectedPeriod) return;
    setLoading(true);
    try {
      const data = await talentApi.getNineBoxData(selectedPeriod);
      setNineBoxData(data);
    } catch { toast({ variant: 'destructive', title: '加载九宫格数据失败' }); }
    finally { setLoading(false); }
  }, [selectedPeriod, toast]);

  useEffect(() => { loadPeriods(); }, [loadPeriods]);
  useEffect(() => { loadNineBoxData(); }, [loadNineBoxData]);

  const getEmployeesInCell = (position: string): TalentAssessment[] => {
    return nineBoxData?.grid[position] || [];
  };

  const selectedEmployees = selectedCell ? getEmployeesInCell(selectedCell) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">人才九宫格</h1>
          <p className="text-slate-500">绩效与潜力双维度人才分析</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[200px]">
            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="选择考核周期" />
          </SelectTrigger>
          <SelectContent>
            {periods.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Grid3X3 className="w-5 h-5" />九宫格矩阵</CardTitle></CardHeader>
          <CardContent>
            <div className="flex mb-4">
              <div className="w-8 flex flex-col justify-around text-xs text-slate-500 pr-2">
                <span>高</span>
                <span>中</span>
                <span>低</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-500 text-center mb-1">← 潜力</div>
                {loading ? (
                  <div className="grid grid-cols-3 gap-2 aspect-square">
                    {Array.from({ length: 9 }).map((_, i) => <div key={i} className="bg-slate-100 rounded-lg animate-pulse" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {GRID_CONFIG.map(cell => {
                      const employees = getEmployeesInCell(cell.position);
                      const isSelected = selectedCell === cell.position;
                      return (
                        <div
                          key={cell.position}
                          onClick={() => setSelectedCell(isSelected ? null : cell.position)}
                          className={cn(
                            'aspect-square rounded-lg border-2 p-3 cursor-pointer transition-all flex flex-col',
                            cell.color,
                            isSelected && 'ring-2 ring-blue-500 ring-offset-2'
                          )}
                        >
                          <div className="text-sm font-medium text-slate-700">{cell.label}</div>
                          <div className="flex-1 flex items-center justify-center">
                            <div className="text-3xl font-bold text-slate-800">{employees.length}</div>
                          </div>
                          <div className="text-xs text-slate-500 text-center">
                            {nineBoxData?.summary.total ? `${Math.round((employees.length / nineBoxData.summary.total) * 100)}%` : '0%'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="text-xs text-slate-500 text-center mt-1">绩效 →</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {selectedCell ? GRID_CONFIG.find(c => c.position === selectedCell)?.label : '员工列表'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedCell ? (
              <p className="text-center text-slate-500 py-8">点击九宫格查看员工</p>
            ) : selectedEmployees.length === 0 ? (
              <p className="text-center text-slate-500 py-8">该区域暂无员工</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {selectedEmployees.map(emp => (
                  <div key={emp.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{emp.employee?.name}</div>
                        <div className="text-xs text-slate-500">{emp.employee?.department?.name}</div>
                      </div>
                      <Badge variant="outline">{emp.gridLabel}</Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-slate-400" />
                        <span>绩效: {emp.performanceScore}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-slate-400" />
                        <span>潜力: {emp.potentialScore}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>分布统计</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-4">
            {GRID_CONFIG.map(cell => {
              const count = getEmployeesInCell(cell.position).length;
              const pct = nineBoxData?.summary.total ? Math.round((count / nineBoxData.summary.total) * 100) : 0;
              return (
                <div key={cell.position} className="text-center">
                  <div className={cn('w-full h-2 rounded-full mb-2', cell.color.replace('border-', 'bg-').split(' ')[0])} />
                  <div className="text-sm font-medium">{cell.label}</div>
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-xs text-slate-500">{pct}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

TalentNineBoxView.displayName = 'TalentNineBoxView';
