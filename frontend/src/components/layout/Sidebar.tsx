import React from 'react';
import { LucideIcon, LayoutDashboard, Target, Users, FileText, Settings, LogOut, Languages, Home, Calendar, FileSpreadsheet, Shield } from 'lucide-react';
import { View, Language } from '../../types';
import { SimpleAvatar as Avatar } from '../ui/avatar';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onLogout: () => void;
}

interface NavItem {
  view: View;
  icon: LucideIcon;
  label: { en: string; zh: string };
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { view: 'landing', icon: Home, label: { en: 'Home', zh: '首页' } },
  { view: 'dashboard', icon: LayoutDashboard, label: { en: 'Dashboard', zh: '仪表盘' } },
  { view: 'kpi-management', icon: Target, label: { en: 'KPI Management', zh: 'KPI 管理' } },
  { view: 'team-management', icon: Users, label: { en: 'Team Management', zh: '团队管理' }, adminOnly: true },
  { view: 'reports', icon: FileText, label: { en: 'Reports / Audit', zh: '报告 / 审计' } },
  { view: 'kpi-library', icon: Target, label: { en: 'KPI Library', zh: '指标库' } },
  { view: 'assessment', icon: Calendar, label: { en: 'Assessment Period', zh: '考核周期' } },
  { view: 'data-entry', icon: FileSpreadsheet, label: { en: 'Data Entry', zh: '数据填报' } },
  { view: 'permissions', icon: Shield, label: { en: 'Permissions', zh: '权限管理' }, adminOnly: true },
  { view: 'settings', icon: Settings, label: { en: 'Settings', zh: '设置' } },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, language, setLanguage, onLogout }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'GROUP_ADMIN' || user?.role === 'SUPER_ADMIN';
  const toggleLanguage = () => setLanguage(language === 'en' ? 'zh' : 'en'); // 语言切换

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Target className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold">
            SmartKPI<span className="text-indigo-400">.AI</span>
          </h1>
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Avatar
            name={user?.username || 'Admin User'}
            email={user?.email || 'admin@smartkpi.ai'}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.username || 'Admin User'}</div>
            <div className="text-xs text-slate-400 uppercase">{user?.role || 'ADMIN'}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;

          const Icon = item.icon;
          const isActive = currentView === item.view;

          return (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                transition-colors
                ${isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label[language]}</span>
            </button>
          );
        })}
      </nav>

      {/* Language Switcher & Logout */}
      <div className="p-4 border-t border-slate-800 space-y-1">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Languages className="w-5 h-5" />
          <span>{language === 'en' ? '中文' : 'English'}</span>
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>{language === 'en' ? 'Logout' : '退出登录'}</span>
        </button>
      </div>
    </div>
  );
};

