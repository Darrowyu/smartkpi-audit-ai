import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Clock, Calendar } from 'lucide-react';
import { usersApi } from '@/api/users.api';
import { Language } from '@/types';
import { SectionCard } from '../components/SectionCard';

interface LanguageTabProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

type DateFormat = 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY年MM月DD日';
type TimeFormat = '24h' | '12h';

const LANGUAGES = [
  { code: 'zh' as Language, label: 'CN', name: '简体中文' },
  { code: 'zh-TW' as Language, label: 'TW', name: '繁體中文' },
  { code: 'en' as Language, label: 'US', name: 'English (US)' },
  { code: 'ja' as Language, label: 'JP', name: '日本語' },
];

const TIMEZONES = [
  { value: 'Asia/Shanghai', label: '北京时间 (UTC+8)' },
  { value: 'Asia/Tokyo', label: '东京时间 (UTC+9)' },
  { value: 'America/New_York', label: '纽约时间 (UTC-5)' },
  { value: 'America/Los_Angeles', label: '洛杉矶时间 (UTC-8)' },
  { value: 'Europe/London', label: '伦敦时间 (UTC+0)' },
  { value: 'Europe/Paris', label: '巴黎时间 (UTC+1)' },
];

const DATE_FORMATS: { value: DateFormat; label: string }[] = [
  { value: 'YYYY-MM-DD', label: '2024-01-15' },
  { value: 'DD/MM/YYYY', label: '15/01/2024' },
  { value: 'MM/DD/YYYY', label: '01/15/2024' },
  { value: 'YYYY年MM月DD日', label: '2024年01月15日' },
];

const TIME_FORMATS: { value: TimeFormat; label: string }[] = [
  { value: '24h', label: '24小时制 (14:30)' },
  { value: '12h', label: '12小时制 (2:30 PM)' },
];

export const LanguageTab: React.FC<LanguageTabProps> = ({ language, setLanguage }) => {
  const { t } = useTranslation();
  const [timezone, setTimezone] = useState('Asia/Shanghai');
  const [dateFormat, setDateFormat] = useState<DateFormat>('YYYY-MM-DD');
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('24h');

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    usersApi.updateProfile({ language: lang }).catch(() => {});
  };

  const previewDateTime = useMemo(() => {
    const dateStr = DATE_FORMATS.find(f => f.value === dateFormat)?.label || '2024-01-15';
    const timeStr = timeFormat === '24h' ? '14:30' : '2:30 PM';
    return `${dateStr} ${timeStr}`;
  }, [dateFormat, timeFormat]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">{t('settings.language.title', '语言与区域')}</h2>
        <p className="text-sm text-slate-500 mt-1">{t('settings.language.subtitle', '设置语言、时区和日期格式')}</p>
      </div>

      {/* 界面语言 */}
      <SectionCard icon={<Globe className="w-5 h-5" />} title={t('settings.language.interfaceLanguage', '界面语言')} description={t('settings.language.interfaceLanguageDesc', '选择系统显示语言')}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {LANGUAGES.map(lang => {
            const isActive = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border-2 text-left transition-all ${
                  isActive ? 'border-brand-primary bg-brand-primary/5' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className={`text-xs sm:text-sm font-medium ${isActive ? 'text-brand-primary' : 'text-slate-500'}`}>{lang.label}</span>
                <span className={`text-xs sm:text-sm truncate ${isActive ? 'text-brand-primary font-medium' : 'text-slate-700'}`}>{lang.name}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* 时区设置 */}
      <SectionCard icon={<Clock className="w-5 h-5" />} title={t('settings.language.timezone', '时区设置')} description={t('settings.language.timezoneDesc', '选择您所在的时区')}>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full sm:w-80 px-3 sm:px-4 py-2 border border-slate-200 rounded-lg text-sm sm:text-base text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
        >
          {TIMEZONES.map(tz => (
            <option key={tz.value} value={tz.value}>{tz.label}</option>
          ))}
        </select>
      </SectionCard>

      {/* 日期与时间格式 */}
      <SectionCard icon={<Calendar className="w-5 h-5" />} title={t('settings.language.dateTimeFormat', '日期与时间格式')} description={t('settings.language.dateTimeFormatDesc', '自定义日期和时间的显示格式')}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">{t('settings.language.dateFormat', '日期格式')}</label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as DateFormat)}
                className="w-full px-3 sm:px-4 py-2 border border-slate-200 rounded-lg text-sm sm:text-base text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              >
                {DATE_FORMATS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">{t('settings.language.timeFormat', '时间格式')}</label>
              <select
                value={timeFormat}
                onChange={(e) => setTimeFormat(e.target.value as TimeFormat)}
                className="w-full px-3 sm:px-4 py-2 border border-slate-200 rounded-lg text-sm sm:text-base text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              >
                {TIME_FORMATS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-brand-primary mb-1">{t('settings.language.preview', '预览')}</div>
            <div className="text-base sm:text-lg font-medium text-slate-800">{previewDateTime}</div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};
