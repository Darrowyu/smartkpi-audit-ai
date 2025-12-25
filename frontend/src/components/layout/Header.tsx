import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Languages, Home, Building2 } from 'lucide-react';
import { Language, View } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  currentView: View;
  setCurrentView: (view: View) => void;
  hasAnalysis?: boolean;
}

const Header: React.FC<HeaderProps> = ({ language, setLanguage, currentView, setCurrentView }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toggleLanguage = () => setLanguage(language === 'en' ? 'zh' : 'en');
  const isAdmin = user?.role === 'GROUP_ADMIN' || user?.role === 'SUPER_ADMIN';

  const navClass = (view: View) => `text-sm font-medium transition-colors pb-1 border-b-2
    ${currentView === view ? 'text-blue-600 border-blue-600' : 'text-slate-600 border-transparent hover:text-blue-600'}`;

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setCurrentView('landing')}>
          <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition-colors shadow-sm">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">SmartKPI<span className="text-blue-600">.AI</span></h1>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6 h-16 pt-1">
            <button onClick={() => setCurrentView('landing')} className={navClass('landing')}>
              <Home className="w-4 h-4 inline-block mr-1 mb-0.5" />{language === 'en' ? 'Home' : '首页'}
            </button>
            <button onClick={() => setCurrentView('dashboard')} className={navClass('dashboard')}>{t('dashboard')}</button>
            <button onClick={() => setCurrentView('history')} className={navClass('history')}>{t('history')}</button>
            {isAdmin && (
              <>
                <button onClick={() => setCurrentView('organization')} className={navClass('organization')}>{language === 'en' ? 'Organization' : '组织'}</button>
                <button onClick={() => setCurrentView('company')} className={navClass('company')}>
                  <Building2 className="w-4 h-4 inline-block mr-1 mb-0.5" />{language === 'en' ? 'Company Settings' : '公司设置'}
                </button>
              </>
            )}
            <button onClick={() => setCurrentView('settings')} className={navClass('settings')}>{t('settings')}</button>
          </nav>
          <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
          <button onClick={toggleLanguage} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-full">
            <Languages className="w-3.5 h-3.5" /><span>{language === 'en' ? 'CN' : 'EN'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
