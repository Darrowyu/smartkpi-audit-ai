import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { LucideIcon, LayoutDashboard, Target, Users, FileText, Settings, LogOut, Home, Calendar, FileSpreadsheet, Shield, ClipboardList, Building2, ChevronDown, ChevronRight, Globe, Building, User, ListChecks, PenLine, X, CheckSquare, Scale, PieChart, MessageSquare, Grid3X3, DollarSign, ClipboardCheck, Database, Palette, Bell, Lock } from 'lucide-react';
import { Language } from '../../types';
import { SimpleAvatar as Avatar } from '../ui/avatar';
import { useAuth } from '../../context/AuthContext';
import { getAvatarUrl } from '../../api/users.api';
import logoImage from '../../assets/images/Makrite_KPI_logo.png';

interface SidebarProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  onLogout: () => void;
  onClose?: () => void;
  collapsed?: boolean;
}

interface NavItem {
  path: string;
  icon: LucideIcon;
  labelKey: string;
}

const managerBusinessNavItems: NavItem[] = [
  { path: '/app', icon: Home, labelKey: 'sidebar.home' },
  { path: '/app/dashboard', icon: LayoutDashboard, labelKey: 'sidebar.dashboard' },
  { path: '/app/kpi-library', icon: Target, labelKey: 'sidebar.kpiLibrary' },
  { path: '/app/assessment', icon: Calendar, labelKey: 'sidebar.assessment' },
  { path: '/app/assignment', icon: ClipboardList, labelKey: 'sidebar.assignment' },
  { path: '/app/data-entry', icon: FileSpreadsheet, labelKey: 'sidebar.dataEntry' },
  { path: '/app/data-approval', icon: CheckSquare, labelKey: 'sidebar.dataApproval' },
  { path: '/app/checkin', icon: ClipboardCheck, labelKey: 'sidebar.checkin' },
  { path: '/app/interview', icon: MessageSquare, labelKey: 'sidebar.interview' },
  { path: '/app/reports', icon: FileText, labelKey: 'sidebar.reports' },
];

const userPersonalNavItems: NavItem[] = [
  { path: '/app', icon: Home, labelKey: 'sidebar.home' },
  { path: '/app/my-dashboard', icon: User, labelKey: 'sidebar.myDashboard' },
  { path: '/app/my-kpis', icon: ListChecks, labelKey: 'sidebar.myKPIs' },
  { path: '/app/self-evaluation', icon: PenLine, labelKey: 'sidebar.selfEvaluation' },
];

const userMenuItems: NavItem[] = [
  { path: '/app/settings', icon: Settings, labelKey: 'sidebar.mySettings' },
  { path: '/app/settings?tab=appearance', icon: Palette, labelKey: 'sidebar.appearance' },
  { path: '/app/settings?tab=notifications', icon: Bell, labelKey: 'sidebar.notifications' },
  { path: '/app/settings?tab=security', icon: Lock, labelKey: 'sidebar.security' },
];

const adminNavItems: NavItem[] = [
  { path: '/app/group-dashboard', icon: Building2, labelKey: 'sidebar.groupCenter' },
  { path: '/app/group-settings', icon: Globe, labelKey: 'sidebar.groupSettings' },
  { path: '/app/company-settings', icon: Building, labelKey: 'sidebar.companySettings' },
  { path: '/app/team', icon: Users, labelKey: 'sidebar.users' },
  { path: '/app/permissions', icon: Shield, labelKey: 'sidebar.permissions' },
];

const performanceAdminNavItems: NavItem[] = [
  { path: '/app/calibration', icon: Scale, labelKey: 'sidebar.calibration' },
  { path: '/app/distribution', icon: PieChart, labelKey: 'sidebar.distribution' },
  { path: '/app/talent', icon: Grid3X3, labelKey: 'sidebar.talent' },
  { path: '/app/salary', icon: DollarSign, labelKey: 'sidebar.salary' },
  { path: '/app/datasource', icon: Database, labelKey: 'sidebar.datasource' },
];

export const Sidebar: React.FC<SidebarProps> = ({ onLogout, onClose, collapsed = false }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'GROUP_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isUser = user?.role === 'USER';
  const [adminExpanded, setAdminExpanded] = useState(false);
  const [perfExpanded, setPerfExpanded] = useState(false);

  const isAdminViewActive = adminNavItems.some(item => location.pathname === item.path);
  const isPerfViewActive = performanceAdminNavItems.some(item => location.pathname === item.path);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const avatarUrl = useMemo(() => user?.avatar ? getAvatarUrl(user.id) : undefined, [user]);

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const businessNavItems = useMemo(() => {
    if (isUser) return userPersonalNavItems;
    return managerBusinessNavItems;
  }, [isUser]);

  useEffect(() => {
    if (isAdminViewActive) setAdminExpanded(true);
    if (isPerfViewActive) setPerfExpanded(true);
  }, [isAdminViewActive, isPerfViewActive]);

  const handleNavClick = (path: string) => {
    navigate(path);
    onClose?.();
  };

  const handleLogout = () => {
    onLogout();
    navigate('/', { replace: true }); // 替换 /app 为 /
    setTimeout(() => navigate('/login'), 0); // 添加 /login 到历史
  };

  const NavButton: React.FC<{ item: NavItem; compact?: boolean }> = ({ item, compact }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <button
        onClick={() => handleNavClick(item.path)}
        title={collapsed ? t(item.labelKey) : undefined}
        className={`group relative w-full flex items-center py-2.5 text-sm font-medium transition-colors transition-opacity duration-200 touch-target
          ${isActive ? 'text-nav-text bg-nav-active' : 'text-nav-text opacity-75 hover:opacity-100 hover:bg-black/10'}
          ${compact ? 'py-1.5 pl-7 text-xs' : 'pl-[22px]'}
        `}
      >
        {isActive && (
          <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] bg-nav-accent rounded-r-full ${compact ? 'h-4' : 'h-5'}`} />
        )}
        <Icon className={`flex-shrink-0 ${compact ? 'w-4 h-4' : 'w-5 h-5'} ${isActive ? 'text-nav-accent' : ''}`} />
        <span className={`ml-2 truncate whitespace-nowrap transition-all duration-300 overflow-hidden ${collapsed ? 'w-0 ml-0 opacity-0' : 'opacity-100'}`}>
          {t(item.labelKey)}
        </span>
      </button>
    );
  };

  const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className={`pl-[22px] py-2 mt-4 first:mt-0 overflow-hidden transition-all duration-300 ${collapsed ? 'h-0 opacity-0 mt-0 py-0' : 'h-auto opacity-100'}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-nav-text opacity-60 whitespace-nowrap">
        {children}
      </span>
    </div>
  );

  return (
    <div className={`${collapsed ? 'w-16 overflow-visible' : 'w-72 sm:w-64'} bg-nav-bg text-nav-text flex flex-col h-full border-r border-nav-border transition-all duration-300 ease-in-out`}>
      {/* Logo 区域 */}
      <div className="h-14 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center pl-4">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <img src={logoImage} alt="Makrite KPI" className="h-4 w-auto" />
          </div>
          <span className={`ml-2 text-base font-semibold tracking-tight whitespace-nowrap transition-all duration-300 overflow-hidden ${collapsed ? 'w-0 ml-0 opacity-0' : 'opacity-100'}`}>
            Makrite KPI
          </span>
        </div>

        {/* 移动端关闭按钮 */}
        {onClose && !collapsed && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 -mr-2 text-nav-text opacity-75 hover:opacity-100 hover:bg-black/10 rounded-lg transition-colors transition-opacity touch-target"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 导航区域 - 可滚动 */}
      <nav className={`flex-1 py-2 scrollbar-hide ${collapsed ? 'overflow-visible' : 'overflow-y-auto'}`}>
        {/* 业务/个人区块 */}
        <SectionLabel>
          {isUser ? t('sidebar.mySection', '我的') : t('sidebar.businessSection', '业务功能')}
        </SectionLabel>
        <div className="space-y-0.5">
          {businessNavItems.map((item) => (
            <NavButton key={item.path} item={item} />
          ))}
        </div>

        {/* 管理员区块 */}
        {isAdmin && (
          <>
            <SectionLabel>{t('sidebar.adminSection', '系统管理')}</SectionLabel>
            <div className="space-y-0.5">
              {/* 组织管理折叠组 */}
              {collapsed ? (
                <div className="group relative">
                  <button
                    className="w-full flex items-center pl-[22px] py-2.5 text-nav-text opacity-75 hover:opacity-100 hover:bg-black/10 transition-colors transition-opacity duration-200"
                  >
                    <Building2 className="w-5 h-5" />
                  </button>
                  <div className="absolute left-full top-0 pl-2 hidden group-hover:block z-50">
                    <div className="absolute left-0 top-0 w-2 h-full" />
                  <div className="bg-nav-bg rounded-lg shadow-xl border border-nav-border py-2 min-w-[180px]">
                    <div className="px-3 py-1.5 text-xs font-semibold text-nav-text opacity-70 uppercase">{t('sidebar.orgAdmin', '组织管理')}</div>
                      {adminNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <button
                            key={item.path}
                            onClick={() => handleNavClick(item.path)}
                          className={`w-full flex items-center px-3 py-2 text-sm transition-colors transition-opacity ${isActive ? 'text-nav-text bg-nav-active' : 'text-nav-text opacity-75 hover:opacity-100 hover:bg-black/10'}`}
                          >
                          <Icon className={`w-5 h-5 ${isActive ? 'text-nav-accent' : ''}`} />
                            <span className="ml-2">{t(item.labelKey)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setAdminExpanded(!adminExpanded)}
                    className="group relative w-full flex items-center justify-between pl-[22px] pr-3 py-2.5 text-sm font-medium transition-colors transition-opacity duration-200 touch-target text-nav-text opacity-75 hover:opacity-100 hover:bg-black/10"
                  >
                    <div className="flex items-center">
                      <Building2 className="w-5 h-5 flex-shrink-0" />
                      <span className="ml-2 whitespace-nowrap">
                        {t('sidebar.orgAdmin', '组织管理')}
                      </span>
                    </div>
                    <div>
                      {adminExpanded ? <ChevronDown className="w-4 h-4 text-nav-text opacity-70" /> : <ChevronRight className="w-4 h-4 text-nav-text opacity-70" />}
                    </div>
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 ${adminExpanded ? 'max-h-60' : 'max-h-0'}`}>
                    {adminNavItems.map((item) => (
                      <NavButton key={item.path} item={item} compact />
                    ))}
                  </div>
                </>
              )}

              {/* 绩效管理折叠组 */}
              {collapsed ? (
                <div className="group relative">
                  <button
                    className="w-full flex items-center pl-[22px] py-2.5 text-nav-text opacity-75 hover:opacity-100 hover:bg-black/10 transition-colors transition-opacity duration-200"
                  >
                    <Scale className="w-5 h-5" />
                  </button>
                  <div className="absolute left-full top-0 pl-2 hidden group-hover:block z-50">
                    <div className="absolute left-0 top-0 w-2 h-full" />
                  <div className="bg-nav-bg rounded-lg shadow-xl border border-nav-border py-2 min-w-[180px]">
                    <div className="px-3 py-1.5 text-xs font-semibold text-nav-text opacity-70 uppercase">{t('sidebar.perfAdmin', '绩效管理')}</div>
                      {performanceAdminNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <button
                            key={item.path}
                            onClick={() => handleNavClick(item.path)}
                          className={`w-full flex items-center px-3 py-2 text-sm transition-colors transition-opacity ${isActive ? 'text-nav-text bg-nav-active' : 'text-nav-text opacity-75 hover:opacity-100 hover:bg-black/10'}`}
                          >
                          <Icon className={`w-5 h-5 ${isActive ? 'text-nav-accent' : ''}`} />
                            <span className="ml-2">{t(item.labelKey)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setPerfExpanded(!perfExpanded)}
                    className="group relative w-full flex items-center justify-between pl-[22px] pr-3 py-2.5 text-sm font-medium transition-colors transition-opacity duration-200 touch-target text-nav-text opacity-75 hover:opacity-100 hover:bg-black/10"
                  >
                    <div className="flex items-center">
                      <Scale className="w-5 h-5 flex-shrink-0" />
                      <span className="ml-2 whitespace-nowrap">
                        {t('sidebar.perfAdmin', '绩效管理')}
                      </span>
                    </div>
                    <div>
                      {perfExpanded ? <ChevronDown className="w-4 h-4 text-nav-text opacity-70" /> : <ChevronRight className="w-4 h-4 text-nav-text opacity-70" />}
                    </div>
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 ${perfExpanded ? 'max-h-60' : 'max-h-0'}`}>
                    {performanceAdminNavItems.map((item) => (
                      <NavButton key={item.path} item={item} compact />
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </nav>

      {/* 用户信息区域 */}
      <div className="border-t border-white/10 py-2 safe-area-bottom relative" ref={userMenuRef}>
        {/* 用户菜单弹出层 */}
        {userMenuOpen && (
          <div className={`absolute ${collapsed ? 'left-full ml-2' : 'left-3 right-3'} bottom-full mb-2 bg-card rounded-lg shadow-xl border border-border py-2 z-50`}>
            {/* 用户信息头部 */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar name={user?.username || 'User'} email={user?.email || ''} avatarUrl={avatarUrl} size="md" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{user?.username || 'User'}</div>
                  <div className="text-xs text-muted-foreground truncate">{user?.email || ''}</div>
                </div>
              </div>
            </div>
            {/* 菜单项 */}
            <div className="py-1">
              {userMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <Icon className="w-4 h-4 mr-3 text-muted-foreground" />
                    {t(item.labelKey)}
                  </button>
                );
              })}
            </div>
            {/* 退出登录 */}
            <div className="border-t border-border pt-1">
              <button
                onClick={() => {
                  handleLogout();
                  setUserMenuOpen(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3 text-muted-foreground" />
                {t('sidebar.logout', '退出登录')}
              </button>
            </div>
          </div>
        )}

        {/* 用户头像按钮 */}
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="w-full flex items-center pl-4 py-2 hover:bg-black/10 transition-colors duration-200"
        >
          <Avatar name={user?.username || 'User'} email={user?.email || ''} avatarUrl={avatarUrl} size="sm" />
          <div className={`ml-2 text-left transition-all duration-300 overflow-hidden ${collapsed ? 'w-0 opacity-0' : 'opacity-100'}`}>
            <div className="text-sm font-medium text-nav-text truncate whitespace-nowrap">
              {user?.username || 'User'}
            </div>
            <div className="text-[10px] text-nav-text opacity-70 uppercase tracking-wide whitespace-nowrap">
              {user?.role || 'USER'}
            </div>
          </div>
        </button>

      </div>
    </div>
  );
};
