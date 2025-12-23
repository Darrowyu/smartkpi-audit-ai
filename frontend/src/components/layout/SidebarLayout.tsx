import React from 'react';
import { Sidebar } from './Sidebar';
import { View, Language } from '../../types';

interface SidebarLayoutProps {
  children: React.ReactNode;
  currentView: View;
  setCurrentView: (view: View) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onLogout: () => void;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  currentView,
  setCurrentView,
  language,
  setLanguage,
  onLogout,
}) => {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        language={language}
        setLanguage={setLanguage}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

