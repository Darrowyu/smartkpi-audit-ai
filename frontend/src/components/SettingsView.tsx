import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';
import { Settings, Trash2, Languages, ShieldCheck, Check, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SettingsViewProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  onLogout?: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ language, setLanguage, onLogout }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [cleared, setCleared] = useState(false);

  const handleClearHistory = () => {
    if (confirm(t('confirmClearHistory'))) {
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-[#1E4B8E]/10 rounded-lg">
            <Settings className="w-6 h-6 text-[#1E4B8E]" />
          </div>
          {t('settingsTitle')}
        </h2>
        <p className="text-slate-500 mt-2 ml-12">{t('settings.subtitle', '管理您的个人偏好设置')}</p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-[#1E4B8E]" />
            <h3 className="text-lg font-semibold text-slate-800">{t('settings.profile', '账户信息')}</h3>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">{t('username')}</span>
                <p className="font-medium text-slate-800 mt-1">{user?.username || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500">{t('email')}</span>
                <p className="font-medium text-slate-800 mt-1">{user?.email || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500">{t('role')}</span>
                <p className="font-medium text-slate-800 mt-1">{user?.role || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500">{t('department')}</span>
                <p className="font-medium text-slate-800 mt-1">{user?.department?.name || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Language Setting */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <Languages className="w-5 h-5 text-[#1E4B8E]" />
            <h3 className="text-lg font-semibold text-slate-800">{t('languageSetting')}</h3>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all
                ${language === 'en'
                  ? 'bg-[#1E4B8E]/10 border-[#1E4B8E] text-[#1E4B8E]'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('zh')}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all
                ${language === 'zh'
                  ? 'bg-[#1E4B8E]/10 border-[#1E4B8E] text-[#1E4B8E]'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
            >
              中文
            </button>
          </div>
        </div>

        {/* Clear Data */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-5 h-5 text-[#1E4B8E]" />
            <h3 className="text-lg font-semibold text-slate-800">{t('clearData')}</h3>
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-500">{t('clearHistoryDesc')}</p>
            <button
              onClick={handleClearHistory}
              disabled={cleared}
              className={`px-4 py-2 rounded-lg text-sm font-medium border flex items-center gap-2 transition-all
                ${cleared
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-white text-red-600 border-red-200 hover:bg-red-50'}`}
            >
              {cleared ? <><Check className="w-4 h-4" />{t('cleared')}</> : <><Trash2 className="w-4 h-4" />{t('clearHistory')}</>}
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-5 h-5 text-[#1E4B8E]" />
            <h3 className="text-lg font-semibold text-slate-800">{t('aboutApp')}</h3>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">SmartKPI AI</span>
            <span className="font-mono text-[#1E4B8E] bg-[#1E4B8E]/10 px-2 py-0.5 rounded">{t('version')}</span>
          </div>
          <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg mt-3">{t('privacyNote')}</p>
        </div>

        {/* Logout */}
        {onLogout && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <LogOut className="w-5 h-5 text-[#1E4B8E]" />
              <h3 className="text-lg font-semibold text-slate-800">{t('account')}</h3>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-lg text-sm font-medium border bg-white text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" />{t('signOut')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
