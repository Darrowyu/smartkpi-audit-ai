import React, { useEffect, useState, useCallback, memo } from 'react';
import { DollarSign, Calendar, Calculator, Download, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { salaryApi, SalaryCoefficient, SalaryCalculation } from '@/api/salary.api';
import { assessmentApi } from '@/api/assessment.api';
import { AssessmentPeriod } from '@/types';
import { cn } from '@/lib/utils';
import { TableRowSkeleton } from '@/components/ui/skeleton';

const DEFAULT_COEFFICIENTS = { S: 1.5, A: 1.2, B: 1.0, C: 0.8, D: 0.5 };
const GRADE_COLORS: Record<string, string> = {
  S: 'bg-purple-100 text-purple-700', A: 'bg-emerald-100 text-emerald-700', B: 'bg-blue-100 text-blue-700', C: 'bg-amber-100 text-amber-700', D: 'bg-red-100 text-red-700',
};

export const SalaryView: React.FC = memo(() => {
  const { toast } = useToast();
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [coefficients, setCoefficients] = useState<Record<string, number>>(DEFAULT_COEFFICIENTS);
  const [calculations, setCalculations] = useState<SalaryCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const loadPeriods = useCallback(async () => {
    try {
      const response = await assessmentApi.getPeriods();
      setPeriods(response.data || []);
      if (response.data?.length > 0) setSelectedPeriod(response.data[0].id);
    } catch { toast({ variant: 'destructive', title: '加载考核周期失败' }); }
  }, [toast]);

  const loadCoefficients = useCallback(async () => {
    try {
      const data = await salaryApi.getCoefficients(selectedPeriod || undefined);
      if (data?.length > 0) {
        const coeffMap: Record<string, number> = {};
        data.forEach(c => { coeffMap[c.grade] = c.coefficient; });
        setCoefficients({ ...DEFAULT_COEFFICIENTS, ...coeffMap });
      }
    } catch { /* 使用默认值 */ }
  }, [selectedPeriod]);

  const loadCalculations = useCallback(async () => {
    if (!selectedPeriod) return;
    setLoading(true);
    try {
      const data = await salaryApi.getCalculations(selectedPeriod);
      setCalculations(data || []);
    } catch { /* 忽略 */ }
    finally { setLoading(false); }
  }, [selectedPeriod]);

  useEffect(() => { loadPeriods(); }, [loadPeriods]);
  useEffect(() => { loadCoefficients(); }, [loadCoefficients]);
  useEffect(() => { loadCalculations(); }, [loadCalculations]);

  const handleSaveCoefficients = async () => {
    setSaving(true);
    try {
      await salaryApi.saveCoefficients(coefficients, selectedPeriod || undefined);
      toast({ title: '系数配置已保存' });
    } catch { toast({ variant: 'destructive', title: '保存失败' }); }
    finally { setSaving(false); }
  };

  const handleCalculate = async () => {
    if (!selectedPeriod) return;
    setCalculating(true);
    try {
      const data = await salaryApi.calculateSalary(selectedPeriod);
      setCalculations(data || []);
      toast({ title: '薪酬计算完成' });
    } catch { toast({ variant: 'destructive', title: '计算失败' }); }
    finally { setCalculating(false); }
  };

  const handleExport = async () => {
    if (!selectedPeriod) return;
    try {
      const blob = await salaryApi.exportSalaryData(selectedPeriod, 'csv');
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary_${selectedPeriod}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ title: '导出成功' });
    } catch { toast({ variant: 'destructive', title: '导出失败' }); }
  };

  const totalBonus = calculations.reduce((sum, c) => sum + (c.bonusAmount || 0), 0);
  const avgCoefficient = calculations.length > 0 ? (calculations.reduce((sum, c) => sum + c.coefficient, 0) / calculations.length).toFixed(2) : '0';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">薪酬系数</h1>
          <p className="text-slate-500">绩效等级与薪酬系数关联</p>
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
          <Button variant="outline" onClick={() => setShowConfig(!showConfig)}><Settings className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-primary">{calculations.length}</div><p className="text-sm text-slate-500">计算人数</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-emerald-600">{avgCoefficient}</div><p className="text-sm text-slate-500">平均系数</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-amber-600">¥{totalBonus.toLocaleString()}</div><p className="text-sm text-slate-500">奖金总额</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-slate-600">{Object.keys(GRADE_COLORS).length}</div><p className="text-sm text-slate-500">等级数</p></CardContent></Card>
      </div>

      {showConfig && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />系数配置</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(GRADE_COLORS).map(([grade, color]) => (
                <div key={grade} className="space-y-2">
                  <Badge className={cn('w-full justify-center py-1', color)}>{grade}级</Badge>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="3"
                    value={coefficients[grade] || 1}
                    onChange={e => setCoefficients(prev => ({ ...prev, [grade]: parseFloat(e.target.value) || 1 }))}
                    className="text-center"
                  />
                </div>
              ))}
            </div>
            <Button onClick={handleSaveCoefficients} disabled={saving} className="mt-4">{saving ? '保存中...' : '保存配置'}</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" />薪酬计算结果</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleCalculate} disabled={calculating || !selectedPeriod}><Calculator className="w-4 h-4 mr-2" />{calculating ? '计算中...' : '重新计算'}</Button>
              <Button variant="outline" onClick={handleExport} disabled={calculations.length === 0}><Download className="w-4 h-4 mr-2" />导出</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>员工</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>绩效分</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>系数</TableHead>
                <TableHead className="text-right">基础工资</TableHead>
                <TableHead className="text-right">奖金金额</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} columns={7} />)
              ) : calculations.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-500">暂无计算结果，请点击"重新计算"</TableCell></TableRow>
              ) : (
                calculations.map(calc => (
                  <TableRow key={calc.id}>
                    <TableCell className="font-medium">{calc.employee?.name || '-'}</TableCell>
                    <TableCell>{calc.employee?.department?.name || '-'}</TableCell>
                    <TableCell>{calc.performanceScore}</TableCell>
                    <TableCell><Badge className={cn(GRADE_COLORS[calc.performanceGrade])}>{calc.performanceGrade}</Badge></TableCell>
                    <TableCell>{calc.coefficient}</TableCell>
                    <TableCell className="text-right">{calc.baseSalary ? `¥${calc.baseSalary.toLocaleString()}` : '-'}</TableCell>
                    <TableCell className="text-right font-medium">{calc.bonusAmount ? `¥${calc.bonusAmount.toLocaleString()}` : '-'}</TableCell>
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

SalaryView.displayName = 'SalaryView';
