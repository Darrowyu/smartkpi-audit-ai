import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Palette, Type, LayoutGrid, Loader2, Pipette } from 'lucide-react';
import { SectionCard } from '../components/SectionCard';
import { Toggle } from '../components/Toggle';
import { usersApi, AppearanceSettings } from '@/api/users.api';
import { useToast } from '@/components/ui/use-toast';
import { hexToHsl, darkenColor, lightenColor, isValidHex, isLightColor } from '@/utils/color';

type ThemeMode = 'light' | 'dark' | 'system';
type AccentColor = 'blue' | 'teal' | 'purple' | 'orange' | 'custom';
type FontSize = 'small' | 'medium' | 'large';

const ACCENT_COLOR_MAP: Record<Exclude<AccentColor, 'custom'>, { hex: string; hsl: string }> = {
  blue: { hex: '#1E4B8E', hsl: '213 65% 34%' },
  teal: { hex: '#0D9488', hsl: '175 85% 29%' },
  purple: { hex: '#7C3AED', hsl: '262 83% 58%' },
  orange: { hex: '#EA580C', hsl: '21 90% 48%' },
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

  // 强调色 - 更新所有相关 CSS 变量
  let hex: string, hsl: string;
  if (settings.accentColor === 'custom' && settings.customColor && isValidHex(settings.customColor)) {
    hex = settings.customColor;
    hsl = hexToHsl(hex);
  } else if (settings.accentColor !== 'custom') {
    const colorConfig = ACCENT_COLOR_MAP[settings.accentColor];
    hex = colorConfig.hex;
    hsl = colorConfig.hsl;
  } else {
    hex = ACCENT_COLOR_MAP.blue.hex;
    hsl = ACCENT_COLOR_MAP.blue.hsl;
  }
  
  const darkHex = darkenColor(hex, 15);
  const secondaryHex = lightenColor(hex, 25);
  const isLight = isLightColor(hex);
  
  root.style.setProperty('--accent-color', hex);
  root.style.setProperty('--primary', hsl);
  root.style.setProperty('--ring', hsl);
  root.style.setProperty('--brand-primary', hex);
  root.style.setProperty('--brand-dark', darkHex);
  root.style.setProperty('--brand-secondary', secondaryHex);
  root.style.setProperty('--brand-text', isLight ? '#1e293b' : '#ffffff');
  root.style.setProperty('--brand-text-muted', isLight ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)');
  root.setAttribute('data-accent', settings.accentColor === 'custom' ? 'custom' : settings.accentColor);

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

const PRESET_COLORS: { key: Exclude<AccentColor, 'custom'>; color: string; labelKey: string; defaultLabel: string }[] = [
  { key: 'blue', color: ACCENT_COLOR_MAP.blue.hex, labelKey: 'settings.appearance.colorBlue', defaultLabel: '深蓝色' },
  { key: 'teal', color: ACCENT_COLOR_MAP.teal.hex, labelKey: 'settings.appearance.colorTeal', defaultLabel: '青绿色' },
  { key: 'purple', color: ACCENT_COLOR_MAP.purple.hex, labelKey: 'settings.appearance.colorPurple', defaultLabel: '紫色' },
  { key: 'orange', color: ACCENT_COLOR_MAP.orange.hex, labelKey: 'settings.appearance.colorOrange', defaultLabel: '橙色' },
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
  const colorInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: 'light',
    accentColor: 'blue',
    customColor: '#1E4B8E',
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
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
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
                  isActive ? 'border-brand-primary bg-brand-primary/5' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'text-brand-primary' : 'text-slate-400'}`} />
                <span className={`text-xs sm:text-sm font-medium ${isActive ? 'text-brand-primary' : 'text-slate-600'}`}>
                  {t(option.labelKey, option.defaultLabel)}
                </span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* 强调色 */}
      <SectionCard icon={<Palette className="w-5 h-5" />} title={t('settings.appearance.accentTitle', '强调色')} description={t('settings.appearance.accentDesc', '选择界面的主要强调颜色')}>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {PRESET_COLORS.map(option => {
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
          {/* 自定义颜色按钮 */}
          <button
            onClick={() => colorInputRef.current?.click()}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border-2 transition-all ${
              settings.accentColor === 'custom' ? 'border-slate-400 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center border border-slate-300" 
              style={{ backgroundColor: settings.accentColor === 'custom' ? settings.customColor : 'transparent' }}
            >
              {settings.accentColor !== 'custom' && <Pipette className="w-3 h-3 text-slate-400" />}
            </div>
            <span className="text-xs sm:text-sm font-medium text-slate-700">{t('settings.appearance.colorCustom', '自定义')}</span>
          </button>
          <input
            ref={colorInputRef}
            type="color"
            value={settings.customColor || '#1E4B8E'}
            onChange={(e) => {
              const newColor = e.target.value;
              const newSettings = { ...settings, accentColor: 'custom' as const, customColor: newColor };
              setSettings(newSettings);
              applyTheme(newSettings);
              usersApi.updateAppearanceSettings({ accentColor: 'custom', customColor: newColor }).catch(() => {
                toast({ title: t('settings.appearance.saveFailed', '保存失败'), variant: 'destructive' });
              });
            }}
            className="sr-only"
          />
        </div>
        {settings.accentColor === 'custom' && settings.customColor && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <span>{t('settings.appearance.currentColor', '当前颜色')}:</span>
            <code className="px-2 py-0.5 bg-slate-100 rounded font-mono">{settings.customColor}</code>
          </div>
        )}
      </SectionCard>

      {/* 字体大小 */}
      <SectionCard icon={<Type className="w-5 h-5" />} title={t('settings.appearance.fontSizeTitle', '字体大小')} description={t('settings.appearance.fontSizeDesc', '调整界面的文字大小')}>
        <select
          value={settings.fontSize}
          onChange={(e) => updateSetting('fontSize', e.target.value as FontSize)}
          className="w-full sm:w-64 px-3 sm:px-4 py-2 border border-slate-200 rounded-lg text-sm sm:text-base text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
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
