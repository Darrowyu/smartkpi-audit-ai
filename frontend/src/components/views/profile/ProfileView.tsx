import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Bell, Lock, Target, Palette, Globe, HelpCircle } from 'lucide-react';
import { Language } from '@/types';
import { ProfileTab, SecurityTab, NotificationsTab, LanguageTab, KpiTab, AppearanceTab, HelpTab, PlaceholderTab } from './tabs';

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

const ProfileView: React.FC<ProfileViewProps> = ({ language, setLanguage }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />;
      case 'security':
        return <SecurityTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'language':
        return <LanguageTab language={language} setLanguage={setLanguage} />;
      case 'kpi':
        return <KpiTab />;
      case 'appearance':
        return <AppearanceTab />;
      case 'help':
        return <HelpTab />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* 顶部标签页导航 */}
      <div className="bg-white rounded-xl border border-slate-200 mb-6">
        <div className="flex items-center gap-1 overflow-x-auto px-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'text-[#1E4B8E] border-[#1E4B8E]'
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t(tab.labelKey, tab.defaultLabel)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 标签页内容 */}
      {renderTabContent()}
    </div>
  );
};

export default ProfileView;
