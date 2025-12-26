import React, { useEffect, useState, useCallback, memo } from 'react';
import { PieChart, Settings, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { distributionApi, DistributionConfig, DistributionValidation } from '@/api/distribution.api';
import { assessmentApi } from '@/api/assessment.api';
import { AssessmentPeriod } from '@/types';
import { cn } from '@/lib/utils';

const DEFAULT_DISTRIBUTION = { S: 10, A: 20, B: 40, C: 20, D: 10 };
const GRADE_COLORS: Record<string, string> = {
  S: 'bg-purple-500', A: 'bg-emerald-500', B: 'bg-blue-500', C: 'bg-amber-500', D: 'bg-red-500',
};
const GRADE_LABELS: Record<string, string> = {
  S: '卓越', A: '优秀', B: '良好', C: '待改进', D: '不合格',
};

export const DistributionView: React.FC = memo(() => {
  const { toast } = useToast();
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [config, setConfig] = useState<DistributionConfig | null>(null);
  const [distribution, setDistribution] = useState<Record<string, number>>(DEFAULT_DISTRIBUTION);
  const [isEnforced, setIsEnforced] = useState(false);
  const [tolerance, setTolerance] = useState(5);
  const [validation, setValidation] = useState<DistributionValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPeriods = useCallback(async () => {
    try {
      const response = await assessmentApi.getPeriods();
      setPeriods(response.data || []);
      if (response.data?.length > 0) setSelectedPeriod(response.data[0].id);
    } catch { toast({ variant: 'destructive', title: '加载考核周期失败' }); }
  }, [toast]);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const periodId = selectedPeriod === 'global' ? undefined : selectedPeriod;
      const data = await distributionApi.getConfig(periodId);
      if (data) {
        setConfig(data);
        setDistribution(data.distribution || DEFAULT_DISTRIBUTION);
        setIsEnforced(data.isEnforced);
        setTolerance(data.tolerance);
      }
    } catch { /* 使用默认值 */ }
    finally { setLoading(false); }
  }, [selectedPeriod]);

  const loadValidation = useCallback(async () => {
    if (!selectedPeriod || selectedPeriod === 'global') {
      setValidation(null);
      return;
    }
    try {
      const data = await distributionApi.validate(selectedPeriod);
      setValidation(data);
    } catch { /* 忽略 */ }
  }, [selectedPeriod]);

  useEffect(() => { loadPeriods(); }, [loadPeriods]);
  useEffect(() => { loadConfig(); }, [loadConfig]);
  useEffect(() => { loadValidation(); }, [loadValidation]);

  const handleDistributionChange = (grade: string, value: string) => {
    const num = parseInt(value) || 0;
    setDistribution(prev => ({ ...prev, [grade]: Math.max(0, Math.min(100, num)) }));
  };

  const handleSave = async () => {
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    if (total !== 100) {
      toast({ variant: 'destructive', title: '分布比例总和必须为100%' });
      return;
    }
    setSaving(true);
    try {
      const periodId = selectedPeriod === 'global' ? undefined : selectedPeriod;
      await distributionApi.saveConfig({ periodId, distribution, isEnforced, tolerance });
      toast({ title: '配置已保存' });
      loadConfig();
      loadValidation();
    } catch { toast({ variant: 'destructive', title: '保存失败' }); }
    finally { setSaving(false); }
  };

  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">强制分布</h1>
          <p className="text-slate-500">配置绩效等级分布比例</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[200px]">
            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="选择考核周期" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="global">全局配置</SelectItem>
            {periods.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />分布配置</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {Object.entries(GRADE_LABELS).map(([grade, label]) => (
                <div key={grade} className="flex items-center gap-4">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold', GRADE_COLORS[grade])}>{grade}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-sm text-slate-500">{distribution[grade]}%</span>
                    </div>
                    <Input type="number" min="0" max="100" value={distribution[grade]} onChange={e => handleDistributionChange(grade, e.target.value)} className="w-full" />
                  </div>
                </div>
              ))}
            </div>

            <div className={cn('p-3 rounded-lg flex items-center justify-between', total === 100 ? 'bg-emerald-50' : 'bg-red-50')}>
              <span className="text-sm font-medium">比例总和</span>
              <Badge className={total === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{total}%</Badge>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">强制执行</p>
                  <p className="text-sm text-slate-500">是否强制校验分布比例</p>
                </div>
                <Switch checked={isEnforced} onCheckedChange={setIsEnforced} />
              </div>
              {isEnforced && (
                <div>
                  <label className="text-sm font-medium">容差范围 (%)</label>
                  <Input type="number" min="0" max="20" value={tolerance} onChange={e => setTolerance(parseInt(e.target.value) || 0)} />
                </div>
              )}
            </div>

            <Button onClick={handleSave} disabled={saving || total !== 100} className="w-full">{saving ? '保存中...' : '保存配置'}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="w-5 h-5" />分布预览</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-8 rounded-full overflow-hidden flex">
                {Object.entries(distribution).map(([grade, pct]) => (
                  <div key={grade} className={cn('transition-all', GRADE_COLORS[grade])} style={{ width: `${pct}%` }} title={`${grade}: ${pct}%`} />
                ))}
              </div>

              <div className="grid grid-cols-5 gap-2 text-center">
                {Object.entries(GRADE_LABELS).map(([grade, label]) => (
                  <div key={grade} className="space-y-1">
                    <div className={cn('w-8 h-8 mx-auto rounded flex items-center justify-center text-white text-sm font-bold', GRADE_COLORS[grade])}>{grade}</div>
                    <p className="text-xs text-slate-600">{label}</p>
                    <p className="text-sm font-medium">{distribution[grade]}%</p>
                  </div>
                ))}
              </div>
            </div>

            {validation && selectedPeriod && selectedPeriod !== 'global' && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  {validation.isValid ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-amber-500" />}
                  实际分布校验
                </h4>
                {validation.violations.length > 0 ? (
                  <div className="space-y-2">
                    {validation.violations.map((v, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-amber-50 rounded">
                        <span className="text-sm">{GRADE_LABELS[v.grade]} ({v.grade})</span>
                        <span className="text-sm">期望 {v.expected}% / 实际 {v.actual}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-emerald-600">当前分布符合配置要求</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

DistributionView.displayName = 'DistributionView';
