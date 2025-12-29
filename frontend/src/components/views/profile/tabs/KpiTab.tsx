import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingUp, Settings, Calendar, Loader2 } from 'lucide-react';
import { SectionCard } from '../components/SectionCard';
import { Toggle } from '../components/Toggle';
import { usersApi, KpiPreferences } from '@/api/users.api';
import { useToast } from '@/components/ui/use-toast';

type ViewType = 'month' | 'week' | 'year';
type FrequencyType = 'daily' | 'weekly' | 'monthly';
type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

const Select: React.FC<SelectProps> = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-4 py-2.5 bg-primary/5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary appearance-none cursor-pointer"
    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
  >
    {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
  </select>
);

interface SettingRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

const SettingRow: React.FC<SettingRowProps> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-4 border-t border-slate-100 first:border-0 first:pt-0">
    <div>
      <div className="font-medium text-brand-primary">{label}</div>
      <div className="text-sm text-slate-500">{description}</div>
    </div>
    <Toggle checked={checked} onChange={onChange} />
  </div>
);

const QUARTERS: { key: Quarter; label: string; range: string }[] = [
  { key: 'Q1', label: 'Q1', range: '1月 - 3月' },
  { key: 'Q2', label: 'Q2', range: '4月 - 6月' },
  { key: 'Q3', label: 'Q3', range: '7月 - 9月' },
  { key: 'Q4', label: 'Q4', range: '10月 - 12月' },
];

export const KpiTab: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const pendingRef = useRef<Set<string>>(new Set());

  const [preferences, setPreferences] = useState<KpiPreferences>({
    defaultView: 'month',
    reminderFrequency: 'weekly',
    showProgressBar: true,
    showTrendChart: true,
    autoCalculate: true,
    warningThreshold: 80,
    selectedQuarter: 'Q1',
  });

  useEffect(() => {
    usersApi.getKpiPreferences()
      .then(setPreferences)
      .catch(() => toast({ title: t('settings.kpi.loadFailed', '加载设置失败'), variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [t, toast]);

  const updatePreference = useCallback(async <K extends keyof KpiPreferences>(key: K, value: KpiPreferences[K]) => {
    if (pendingRef.current.has(key)) return;
    pendingRef.current.add(key);
    const prev = preferences[key];
    setPreferences(p => ({ ...p, [key]: value }));
    try {
      await usersApi.updateKpiPreferences({ [key]: value });
    } catch {
      setPreferences(p => ({ ...p, [key]: prev }));
      toast({ title: t('settings.kpi.saveFailed', '保存失败'), variant: 'destructive' });
    } finally {
      pendingRef.current.delete(key);
    }
  }, [preferences, t, toast]);

  const viewOptions = [
    { value: 'month', label: t('settings.kpi.monthView', '月视图') },
    { value: 'week', label: t('settings.kpi.weekView', '周视图') },
    { value: 'year', label: t('settings.kpi.yearView', '年视图') },
  ];

  const frequencyOptions = [
    { value: 'daily', label: t('settings.kpi.daily', '每天') },
    { value: 'weekly', label: t('settings.kpi.weekly', '每周') },
    { value: 'monthly', label: t('settings.kpi.monthly', '每月') },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">{t('settings.kpi.title', 'KPI偏好')}</h2>
        <p className="text-sm text-slate-500 mt-1">{t('settings.kpi.subtitle', '自定义您的KPI显示和提醒设置')}</p>
      </div>

      {/* 显示设置 */}
      <SectionCard icon={<BarChart3 className="w-5 h-5" />} title={t('settings.kpi.displaySettings', '显示设置')} description={t('settings.kpi.displaySettingsDesc', '自定义KPI仪表盘的显示方式')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-primary">{t('settings.kpi.defaultView', '默认视图')}</label>
            <Select value={preferences.defaultView} onChange={(v) => updatePreference('defaultView', v as ViewType)} options={viewOptions} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-primary">{t('settings.kpi.reminderFrequency', '提醒频率')}</label>
            <Select value={preferences.reminderFrequency} onChange={(v) => updatePreference('reminderFrequency', v as FrequencyType)} options={frequencyOptions} />
          </div>
        </div>
        <SettingRow
          label={t('settings.kpi.showProgressBar', '显示进度条')}
          description={t('settings.kpi.showProgressBarDesc', '在KPI卡片上显示进度指示器')}
          checked={preferences.showProgressBar}
          onChange={(v) => updatePreference('showProgressBar', v)}
        />
        <SettingRow
          label={t('settings.kpi.showTrendChart', '显示趋势图')}
          description={t('settings.kpi.showTrendChartDesc', '在仪表盘显示KPI趋势变化')}
          checked={preferences.showTrendChart}
          onChange={(v) => updatePreference('showTrendChart', v)}
        />
      </SectionCard>

      {/* 计算设置 */}
      <SectionCard icon={<TrendingUp className="w-5 h-5" />} title={t('settings.kpi.calcSettings', '计算设置')} description={t('settings.kpi.calcSettingsDesc', '配置KPI的计算和预警规则')}>
        <SettingRow
          label={t('settings.kpi.autoCalculate', '自动计算完成率')}
          description={t('settings.kpi.autoCalculateDesc', '根据子任务自动计算KPI完成进度')}
          checked={preferences.autoCalculate}
          onChange={(v) => updatePreference('autoCalculate', v)}
        />
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-medium text-brand-primary">{t('settings.kpi.warningThreshold', '预警阈值')}</div>
              <div className="text-sm text-slate-500">{t('settings.kpi.warningThresholdDesc', '当KPI完成率低于此值时发出预警')}</div>
            </div>
            <span className="text-lg font-semibold text-brand-primary">{preferences.warningThreshold}%</span>
          </div>
          <div className="mt-4">
            <input
              type="range"
              min="50"
              max="100"
              value={preferences.warningThreshold}
              onChange={(e) => updatePreference('warningThreshold', Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 目标周期 */}
      <SectionCard icon={<Settings className="w-5 h-5" />} title={t('settings.kpi.targetPeriod', '目标周期')} description={t('settings.kpi.targetPeriodDesc', '设置KPI评估周期')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {QUARTERS.map(q => (
            <button
              key={q.key}
              onClick={() => updatePreference('selectedQuarter', q.key)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                preferences.selectedQuarter === q.key
                  ? 'border-brand-primary bg-primary/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Calendar className={`w-5 h-5 mx-auto mb-2 ${preferences.selectedQuarter === q.key ? 'text-brand-primary' : 'text-slate-400'}`} />
              <div className={`font-semibold ${preferences.selectedQuarter === q.key ? 'text-brand-primary' : 'text-slate-700'}`}>{q.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{q.range}</div>
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};
