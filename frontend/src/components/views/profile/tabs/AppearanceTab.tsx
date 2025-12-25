import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Palette, Type, LayoutGrid } from 'lucide-react';
import { SectionCard } from '../components/SectionCard';
import { Toggle } from '../components/Toggle';

type ThemeMode = 'light' | 'dark' | 'system';
type AccentColor = 'blue' | 'teal' | 'purple' | 'orange';
type FontSize = 'small' | 'medium' | 'large';

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
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [accentColor, setAccentColor] = useState<AccentColor>('blue');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [compactMode, setCompactMode] = useState(false);
  const [animations, setAnimations] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">{t('settings.appearance.title', '外观设置')}</h2>
        <p className="text-sm text-slate-500 mt-1">{t('settings.appearance.subtitle', '自定义界面的外观和风格')}</p>
      </div>

      {/* 主题模式 */}
      <SectionCard icon={<Palette className="w-5 h-5" />} title={t('settings.appearance.themeTitle', '主题模式')} description={t('settings.appearance.themeDesc', '选择界面的颜色主题')}>
        <div className="grid grid-cols-3 gap-4">
          {THEME_OPTIONS.map(option => {
            const Icon = option.icon;
            const isActive = theme === option.key;
            return (
              <button
                key={option.key}
                onClick={() => setTheme(option.key)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  isActive ? 'border-[#1E4B8E] bg-[#1E4B8E]/5' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-[#1E4B8E]' : 'text-slate-400'}`} />
                <span className={`text-sm font-medium ${isActive ? 'text-[#1E4B8E]' : 'text-slate-600'}`}>
                  {t(option.labelKey, option.defaultLabel)}
                </span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* 强调色 */}
      <SectionCard icon={<Palette className="w-5 h-5" />} title={t('settings.appearance.accentTitle', '强调色')} description={t('settings.appearance.accentDesc', '选择界面的主要强调颜色')}>
        <div className="flex flex-wrap gap-3">
          {ACCENT_COLORS.map(option => {
            const isActive = accentColor === option.key;
            return (
              <button
                key={option.key}
                onClick={() => setAccentColor(option.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                  isActive ? 'border-slate-400 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: option.color }} />
                <span className="text-sm font-medium text-slate-700">{t(option.labelKey, option.defaultLabel)}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* 字体大小 */}
      <SectionCard icon={<Type className="w-5 h-5" />} title={t('settings.appearance.fontSizeTitle', '字体大小')} description={t('settings.appearance.fontSizeDesc', '调整界面的文字大小')}>
        <select
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value as FontSize)}
          className="w-64 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E4B8E]/20 focus:border-[#1E4B8E]"
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
            <Toggle checked={compactMode} onChange={setCompactMode} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium text-slate-800">{t('settings.appearance.animations', '动画效果')}</div>
              <div className="text-sm text-slate-500">{t('settings.appearance.animationsDesc', '启用界面过渡动画')}</div>
            </div>
            <Toggle checked={animations} onChange={setAnimations} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
};
