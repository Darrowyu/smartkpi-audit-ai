import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';
import { Settings, Trash2, Languages, ShieldCheck, Check, LogOut } from 'lucide-react';

interface SettingsViewProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  onLogout?: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ language, setLanguage, onLogout }) => {
  const { t } = useTranslation();
  const [cleared, setCleared] = useState(false);

  const handleClearHistory = () => {
    if (confirm(t('confirmClearHistory'))) {
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6 text-blue-600" />{t('settingsTitle')}
      </h2>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <Languages className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-800">{t('languageSetting')}</h3>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setLanguage('en')} className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium ${language === 'en' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>English</button>
            <button onClick={() => setLanguage('zh')} className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium ${language === 'zh' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>中文</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-800">{t('clearData')}</h3>
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-500">{t('clearHistoryDesc')}</p>
            <button onClick={handleClearHistory} disabled={cleared} className={`px-4 py-2 rounded-lg text-sm font-medium border flex items-center gap-2 ${cleared ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-red-600 border-red-200 hover:bg-red-50'}`}>
              {cleared ? <><Check className="w-4 h-4" />{t('cleared')}</> : <><Trash2 className="w-4 h-4" />{t('clearHistory')}</>}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-800">{t('aboutApp')}</h3>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">SmartKPI AI</span>
            <span className="font-mono text-slate-700">{t('version')}</span>
          </div>
          <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg mt-2">{t('privacyNote')}</p>
        </div>

        {onLogout && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <LogOut className="w-5 h-5 text-slate-500" />
              <h3 className="text-lg font-semibold text-slate-800">{t('account')}</h3>
            </div>
            <button onClick={onLogout} className="px-4 py-2 rounded-lg text-sm font-medium border bg-white text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2">
              <LogOut className="w-4 h-4" />{t('signOut')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
