import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Palette, Type, LayoutGrid, Loader2 } from 'lucide-react';
import { SectionCard } from '../components/SectionCard';
import { Toggle } from '../components/Toggle';
import { usersApi, AppearanceSettings } from '@/api/users.api';
import { useToast } from '@/components/ui/use-toast';

type ThemeMode = 'light' | 'dark' | 'system';
type AccentColor = 'blue' | 'teal' | 'purple' | 'orange';
type FontSize = 'small' | 'medium' | 'large';

const ACCENT_COLOR_MAP: Record<AccentColor, string> = {
  blue: '#1E4B8E',
  teal: '#0D9488',
  purple: '#7C3AED',
  orange: '#EA580C',
};

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
};

/** 应用主题设置到 DOM */
const applyTheme = (settings: AppearanceSettings) => {
  const root = document.documentElement;

  // 主题模式
  let isDark = settings.theme === 'dark';
  if (settings.theme === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  root.classList.toggle('dark', isDark);

  // 强调色
  root.style.setProperty('--accent-color', ACCENT_COLOR_MAP[settings.accentColor]);

  // 字体大小
  root.style.setProperty('--base-font-size', FONT_SIZE_MAP[settings.fontSize]);

  // 紧凑模式
  root.classList.toggle('compact', settings.compactMode);

  // 动画效果
  root.classList.toggle('no-animations', !settings.animations);
};

const THEME_OPTIONS: { key: ThemeMode; icon: React.ElementType; labelKey: string; defaultLabel: string }[] = [
  { key: 'light', icon: Sun, labelKey: 'settings.appearance.themeLight', defaultLabel: '浅色' },
  { key: 'dark', icon: Moon, labelKey: 'settings.appearance.themeDark', defaultLabel: '深色' },
  { key: 'system', icon: Monitor, labelKey: 'settings.appearance.themeSystem', defaultLabel: '跟随系统' },
];

const ACCENT_COLORS: { key: AccentColor; color: string; labelKey: string; defaultLabel: string }[] = [
  { key: 'blue', color: '#1E4B8E', labelKey: 'settings.appearance.colorBlue', defaultLabel: '深蓝色' },
  { key: 'teal', color: '#0D9488', labelKey: 'settings.appearance.colorTeal', defaultLabel: '青绿色' },
  { key: 'purple', color: '#7C3AED', labelKey: 'settings.appearance.colorPurple', defaultLabel: '紫色' },
  { key: 'orange', color: '#EA580C', labelKey: 'settings.appearance.colorOrange', defaultLabel: '橙色' },
];

const FONT_SIZES: { key: FontSize; labelKey: string; defaultLabel: string }[] = [
  { key: 'small', labelKey: 'settings.appearance.fontSmall', defaultLabel: '小' },
  { key: 'medium', labelKey: 'settings.appearance.fontMedium', defaultLabel: '中' },
  { key: 'large', labelKey: 'settings.appearance.fontLarge', defaultLabel: '大' },
];

export const AppearanceTab: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const pendingRef = useRef<Set<string>>(new Set());

  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: 'light',
    accentColor: 'blue',
    fontSize: 'medium',
    compactMode: false,
    animations: true,
  });

  useEffect(() => {
    usersApi.getAppearanceSettings()
      .then(data => {
        setSettings(data);
        applyTheme(data);
      })
      .catch(() => toast({ title: t('settings.appearance.loadFailed', '加载设置失败'), variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [t, toast]);

  const updateSetting = useCallback(async <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => {
    if (pendingRef.current.has(key)) return;
    pendingRef.current.add(key);
    const prev = settings[key];
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    applyTheme(newSettings);
    try {
      await usersApi.updateAppearanceSettings({ [key]: value });
    } catch {
      const rollback = { ...settings, [key]: prev };
      setSettings(rollback);
      applyTheme(rollback);
      toast({ title: t('settings.appearance.saveFailed', '保存失败'), variant: 'destructive' });
    } finally {
      pendingRef.current.delete(key);
    }
  }, [settings, t, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E4B8E]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">{t('settings.appearance.title', '外观设置')}</h2>
        <p className="text-sm text-slate-500 mt-1">{t('settings.appearance.subtitle', '自定义界面的外观和风格')}</p>
      </div>

      {/* 主题模式 */}
      <SectionCard icon={<Palette className="w-5 h-5" />} title={t('settings.appearance.themeTitle', '主题模式')} description={t('settings.appearance.themeDesc', '选择界面的颜色主题')}>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {THEME_OPTIONS.map(option => {
            const Icon = option.icon;
            const isActive = settings.theme === option.key;
            return (
              <button
                key={option.key}
                onClick={() => updateSetting('theme', option.key)}
                className={`flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all ${
                  isActive ? 'border-[#1E4B8E] bg-[#1E4B8E]/5' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'text-[#1E4B8E]' : 'text-slate-400'}`} />
                <span className={`text-xs sm:text-sm font-medium ${isActive ? 'text-[#1E4B8E]' : 'text-slate-600'}`}>
                  {t(option.labelKey, option.defaultLabel)}
                </span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* 强调色 */}
      <SectionCard icon={<Palette className="w-5 h-5" />} title={t('settings.appearance.accentTitle', '强调色')} description={t('settings.appearance.accentDesc', '选择界面的主要强调颜色')}>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
          {ACCENT_COLORS.map(option => {
            const isActive = settings.accentColor === option.key;
            return (
              <button
                key={option.key}
                onClick={() => updateSetting('accentColor', option.key)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border-2 transition-all ${
                  isActive ? 'border-slate-400 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: option.color }} />
                <span className="text-xs sm:text-sm font-medium text-slate-700 truncate">{t(option.labelKey, option.defaultLabel)}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* 字体大小 */}
      <SectionCard icon={<Type className="w-5 h-5" />} title={t('settings.appearance.fontSizeTitle', '字体大小')} description={t('settings.appearance.fontSizeDesc', '调整界面的文字大小')}>
        <select
          value={settings.fontSize}
          onChange={(e) => updateSetting('fontSize', e.target.value as FontSize)}
          className="w-full sm:w-64 px-3 sm:px-4 py-2 border border-slate-200 rounded-lg text-sm sm:text-base text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E4B8E]/20 focus:border-[#1E4B8E]"
        >
          {FONT_SIZES.map(option => (
            <option key={option.key} value={option.key}>
              {t(option.labelKey, option.defaultLabel)}
            </option>
          ))}
        </select>
      </SectionCard>

      {/* 布局选项 */}
      <SectionCard icon={<LayoutGrid className="w-5 h-5" />} title={t('settings.appearance.layoutTitle', '布局选项')} description={t('settings.appearance.layoutDesc', '调整界面的布局方式')}>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium text-slate-800">{t('settings.appearance.compactMode', '紧凑模式')}</div>
              <div className="text-sm text-slate-500">{t('settings.appearance.compactModeDesc', '减少界面元素的间距')}</div>
            </div>
            <Toggle checked={settings.compactMode} onChange={(v) => updateSetting('compactMode', v)} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium text-slate-800">{t('settings.appearance.animations', '动画效果')}</div>
              <div className="text-sm text-slate-500">{t('settings.appearance.animationsDesc', '启用界面过渡动画')}</div>
            </div>
            <Toggle checked={settings.animations} onChange={(v) => updateSetting('animations', v)} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
};
