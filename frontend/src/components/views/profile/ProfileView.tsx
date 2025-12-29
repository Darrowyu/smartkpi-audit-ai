import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { User, Bell, Lock, Target, Palette, Globe, HelpCircle, Settings } from 'lucide-react';
import { Language } from '@/types';
import { ProfileTab, SecurityTab, NotificationsTab, LanguageTab, KpiTab, AppearanceTab, HelpTab } from './tabs';
import { cn } from '@/lib/utils';

interface ProfileViewProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

type TabKey = 'profile' | 'notifications' | 'security' | 'kpi' | 'appearance' | 'language' | 'help';

const TABS: { key: TabKey; icon: React.ElementType; labelKey: string; defaultLabel: string }[] = [
  { key: 'profile', icon: User, labelKey: 'settings.tabs.profile', defaultLabel: '个人资料' },
  { key: 'notifications', icon: Bell, labelKey: 'settings.tabs.notifications', defaultLabel: '通知' },
  { key: 'security', icon: Lock, labelKey: 'settings.tabs.security', defaultLabel: '安全' },
  { key: 'kpi', icon: Target, labelKey: 'settings.tabs.kpi', defaultLabel: 'KPI偏好' },
  { key: 'appearance', icon: Palette, labelKey: 'settings.tabs.appearance', defaultLabel: '外观' },
  { key: 'language', icon: Globe, labelKey: 'settings.tabs.language', defaultLabel: '语言' },
  { key: 'help', icon: HelpCircle, labelKey: 'settings.tabs.help', defaultLabel: '帮助' },
];

const VALID_TABS: TabKey[] = ['profile', 'notifications', 'security', 'kpi', 'appearance', 'language', 'help'];

const ProfileView: React.FC<ProfileViewProps> = ({ language, setLanguage }) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = VALID_TABS.includes(tabParam as TabKey) ? (tabParam as TabKey) : 'profile';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && VALID_TABS.includes(tab as TabKey)) {
      setActiveTab(tab as TabKey);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchParams(tab === 'profile' ? {} : { tab });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileTab />;
      case 'security': return <SecurityTab />;
      case 'notifications': return <NotificationsTab />;
      case 'language': return <LanguageTab language={language} setLanguage={setLanguage} />;
      case 'kpi': return <KpiTab />;
      case 'appearance': return <AppearanceTab />;
      case 'help': return <HelpTab />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-brand-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">系统设置</h1>
          <p className="text-slate-500">管理您的账户和系统偏好</p>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex items-center min-w-max border-b border-slate-100">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={cn(
                    'flex items-center gap-2 px-4 sm:px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                    isActive
                      ? 'text-brand-primary border-brand-primary bg-brand-primary/5'
                      : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive && 'text-brand-primary')} />
                  <span>{t(tab.labelKey, tab.defaultLabel)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 标签页内容 */}
      {renderTabContent()}
    </div>
  );
};

export default ProfileView;
