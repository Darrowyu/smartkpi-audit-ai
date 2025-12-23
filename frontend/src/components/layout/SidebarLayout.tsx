import React from 'react';
import { Sidebar } from './Sidebar';
import { Language } from '../../types';

interface SidebarLayoutProps {
  children: React.ReactNode;
  language: Language;
  setLanguage: (lang: Language) => void;
  onLogout: () => void;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  language,
  setLanguage,
  onLogout,
}) => {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        language={language}
        setLanguage={setLanguage}
        onLogout={onLogout}
      />
      <div className="flex-1 overflow-y-auto ml-64">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
