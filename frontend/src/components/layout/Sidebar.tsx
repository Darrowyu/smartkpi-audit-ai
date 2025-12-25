import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { LucideIcon, LayoutDashboard, Target, Users, FileText, Settings, LogOut, Home, Calendar, FileSpreadsheet, Shield, ClipboardList, Building2, ChevronDown, ChevronRight, Globe, Building, User, ListChecks, PenLine } from 'lucide-react';
import { Language } from '../../types';
import { SimpleAvatar as Avatar } from '../ui/avatar';
import { useAuth } from '../../context/AuthContext';
import { getAvatarUrl } from '../../api/users.api';
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
}

const managerBusinessNavItems: NavItem[] = [
  { path: '/', icon: Home, labelKey: 'sidebar.home' },
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'sidebar.dashboard' },
  { path: '/kpi-library', icon: Target, labelKey: 'sidebar.kpiLibrary' },
  { path: '/assessment', icon: Calendar, labelKey: 'sidebar.assessment' },
  { path: '/assignment', icon: ClipboardList, labelKey: 'sidebar.assignment' },
  { path: '/data-entry', icon: FileSpreadsheet, labelKey: 'sidebar.dataEntry' },
  { path: '/reports', icon: FileText, labelKey: 'sidebar.reports' },
];

const userPersonalNavItems: NavItem[] = [
  { path: '/', icon: Home, labelKey: 'sidebar.home' },
  { path: '/my-dashboard', icon: User, labelKey: 'sidebar.myDashboard' },
  { path: '/my-kpis', icon: ListChecks, labelKey: 'sidebar.myKPIs' },
  { path: '/self-evaluation', icon: PenLine, labelKey: 'sidebar.selfEvaluation' },
];

const commonPersonalNavItems: NavItem[] = [
  { path: '/settings', icon: Settings, labelKey: 'sidebar.mySettings' },
];

const adminNavItems: NavItem[] = [
  { path: '/group-dashboard', icon: Building2, labelKey: 'sidebar.groupCenter' },
  { path: '/group-settings', icon: Globe, labelKey: 'sidebar.groupSettings' },
  { path: '/company-settings', icon: Building, labelKey: 'sidebar.companySettings' },
  { path: '/team', icon: Users, labelKey: 'sidebar.users' },
  { path: '/permissions', icon: Shield, labelKey: 'sidebar.permissions' },
];

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'GROUP_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isUser = user?.role === 'USER';
  const [adminExpanded, setAdminExpanded] = useState(false);

  const isAdminViewActive = adminNavItems.some(item => location.pathname === item.path);

  const avatarUrl = useMemo(() => user?.avatar ? getAvatarUrl(user.id) : undefined, [user]);

  const businessNavItems = useMemo(() => {
    if (isUser) return userPersonalNavItems;
    return managerBusinessNavItems;
  }, [isUser]);

  useEffect(() => {
    if (isAdminViewActive) {
      setAdminExpanded(true);
    }
  }, [isAdminViewActive]);

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const NavButton: React.FC<{ item: NavItem; compact?: boolean }> = ({ item, compact }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <button
        onClick={() => handleNavClick(item.path)}
        className={`group relative w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200
          ${isActive
            ? 'text-white bg-[#163a6e]'
            : 'text-white/70 hover:text-white hover:bg-[#163a6e]/50'
          }
          ${compact ? 'py-2 pl-6' : ''}
        `}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#5B9BD5] rounded-r-full" />
        )}
        <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-[#5B9BD5]' : ''}`} />
        <span className="truncate">{t(item.labelKey)}</span>
      </button>
    );
  };

  const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="px-3 py-2 mt-4 first:mt-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
        {children}
      </span>
    </div>
  );

  return (
    <div className="w-64 bg-[#1E4B8E] text-white flex flex-col h-screen fixed top-0 left-0 border-r border-[#163a6e]">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
            <img src={logoImage} alt="Makrite KPI" className="h-5 w-auto" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Makrite KPI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {/* Business/Personal Section based on role */}
        <SectionLabel>
          {isUser ? t('sidebar.mySection', '我的') : t('sidebar.businessSection', '业务功能')}
        </SectionLabel>
        <div className="space-y-0.5">
          {businessNavItems.map((item) => (
            <NavButton key={item.path} item={item} />
          ))}
        </div>

        {/* Common Settings Section */}
        <SectionLabel>{t('sidebar.personalSection', '个人')}</SectionLabel>
        <div className="space-y-0.5">
          {commonPersonalNavItems.map((item) => (
            <NavButton key={item.path} item={item} />
          ))}
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <>
            <SectionLabel>{t('sidebar.adminSection', '系统管理')}</SectionLabel>
            <div className="space-y-0.5">
              <button
                onClick={() => setAdminExpanded(!adminExpanded)}
                className={`group relative w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-all duration-200
                  ${isAdminViewActive
                    ? 'text-white bg-[#163a6e]'
                    : 'text-white/70 hover:text-white hover:bg-[#163a6e]/50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Shield className={`w-[18px] h-[18px] ${isAdminViewActive ? 'text-[#5B9BD5]' : ''}`} />
                  <span>{t('sidebar.admin')}</span>
                </div>
                {adminExpanded
                  ? <ChevronDown className="w-4 h-4 text-white/50" />
                  : <ChevronRight className="w-4 h-4 text-white/50" />
                }
              </button>

              <div className={`overflow-hidden transition-all duration-200 ${adminExpanded ? 'max-h-60' : 'max-h-0'}`}>
                {adminNavItems.map((item) => (
                  <NavButton key={item.path} item={item} compact />
                ))}
              </div>
            </div>
          </>
        )}
      </nav>

      {/* User Footer */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#163a6e]/50 transition-colors">
          <Avatar name={user?.username || 'User'} email={user?.email || ''} avatarUrl={avatarUrl} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.username || 'User'}</div>
            <div className="text-[10px] text-white/50 uppercase tracking-wide">{user?.role || 'USER'}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-white/50 hover:text-red-300 hover:bg-[#163a6e] rounded-md transition-colors"
            title={t('sidebar.logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
