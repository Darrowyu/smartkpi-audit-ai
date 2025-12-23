import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { LucideIcon, LayoutDashboard, Target, Users, FileText, Settings, LogOut, Languages, Home, Calendar, FileSpreadsheet, Shield, ClipboardList, Building2, ChevronDown, ChevronRight } from 'lucide-react';
import { Language } from '../../types';
import { SimpleAvatar as Avatar } from '../ui/avatar';
import { useAuth } from '../../context/AuthContext';
import logoImage from '../../assets/images/Makrite_KPI_logo.png';

interface SidebarProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  onLogout: () => void;
}

interface NavItem {
  path: string;
  icon: LucideIcon;
  labelKey: string;
  adminOnly?: boolean;
}

interface NavGroup {
  id: string;
  icon: LucideIcon;
  labelKey: string;
  adminOnly?: boolean;
  children: NavItem[];
}

const mainNavItems: NavItem[] = [
  { path: '/', icon: Home, labelKey: 'sidebar.home' },
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'sidebar.dashboard' },
  { path: '/kpi-library', icon: Target, labelKey: 'sidebar.kpiLibrary' },
  { path: '/assessment', icon: Calendar, labelKey: 'sidebar.assessment' },
  { path: '/assignment', icon: ClipboardList, labelKey: 'sidebar.assignment' },
  { path: '/data-entry', icon: FileSpreadsheet, labelKey: 'sidebar.dataEntry' },
  { path: '/reports', icon: FileText, labelKey: 'sidebar.reports' },
  { path: '/settings', icon: Settings, labelKey: 'sidebar.mySettings' },
];

const adminNavGroup: NavGroup = {
  id: 'admin-settings',
  icon: Shield,
  labelKey: 'sidebar.admin',
  adminOnly: true,
  children: [
    { path: '/group-dashboard', icon: Building2, labelKey: 'sidebar.groupCenter', adminOnly: true },
    { path: '/team', icon: Users, labelKey: 'sidebar.users', adminOnly: true },
    { path: '/permissions', icon: Shield, labelKey: 'sidebar.permissions', adminOnly: true },
  ],
};

export const Sidebar: React.FC<SidebarProps> = ({ language, setLanguage, onLogout }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'GROUP_ADMIN' || user?.role === 'SUPER_ADMIN';
  const [adminExpanded, setAdminExpanded] = useState(false);
  const toggleLanguage = () => setLanguage(language === 'en' ? 'zh' : 'en');

  const isAdminViewActive = adminNavGroup.children.some(item => location.pathname === item.path);

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed top-0 left-0">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-center">
          <img src={logoImage} alt="Makrite KPI" className="h-12 w-auto" />
        </div>
      </div>

      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Avatar name={user?.username || 'User'} email={user?.email || ''} size="md" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.username || 'User'}</div>
            <div className="text-xs text-slate-400 uppercase">{user?.role || 'USER'}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button key={item.path} onClick={() => handleNavClick(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                                ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <Icon className="w-5 h-5" />
              <span>{t(item.labelKey)}</span>
            </button>
          );
        })}

        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-slate-800">
            <button onClick={() => setAdminExpanded(!adminExpanded)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors
                                ${isAdminViewActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5" />
                <span>{t(adminNavGroup.labelKey)}</span>
              </div>
              {adminExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {adminExpanded && (
              <div className="mt-1 ml-4 space-y-1">
                {adminNavGroup.children.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button key={item.path} onClick={() => handleNavClick(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors
                                                ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                      <Icon className="w-4 h-4" />
                      <span>{t(item.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-1">
        <button onClick={toggleLanguage}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
          <Languages className="w-5 h-5" />
          <span>{language === 'en' ? '中文' : 'English'}</span>
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
          <LogOut className="w-5 h-5" />
          <span>{t('sidebar.logout')}</span>
        </button>
      </div>
    </div>
  );
};
