import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTranslation } from 'react-i18next';
import { Language } from '@/types';
import { Languages, Menu, X, PanelLeftClose, PanelLeft } from 'lucide-react';
import { usersApi, AppearanceSettings } from '@/api/users.api';
import { hexToHsl, darkenColor, lightenColor, isValidHex, isLightColor } from '@/utils/color';

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

const ACCENT_COLOR_MAP: Record<string, { hex: string; hsl: string }> = {
    blue: { hex: '#1E4B8E', hsl: '213 65% 34%' },
    teal: { hex: '#0D9488', hsl: '175 85% 29%' },
    purple: { hex: '#7C3AED', hsl: '262 83% 58%' },
    orange: { hex: '#EA580C', hsl: '21 90% 48%' },
};

const FONT_SIZE_MAP: Record<string, string> = {
    small: '14px',
    medium: '16px',
    large: '18px',
};

const applyAppearance = (settings: AppearanceSettings) => {
    const root = document.documentElement;
    let isDark = settings.theme === 'dark';
    if (settings.theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    root.classList.toggle('dark', isDark);
    
    let hex: string, hsl: string;
    if (settings.accentColor === 'custom' && settings.customColor && isValidHex(settings.customColor)) {
        hex = settings.customColor;
        hsl = hexToHsl(hex);
    } else if (settings.accentColor !== 'custom') {
        const colorConfig = ACCENT_COLOR_MAP[settings.accentColor] || ACCENT_COLOR_MAP.blue;
        hex = colorConfig.hex;
        hsl = colorConfig.hsl;
    } else {
        hex = ACCENT_COLOR_MAP.blue.hex;
        hsl = ACCENT_COLOR_MAP.blue.hsl;
    }
    
    const darkHex = darkenColor(hex, 15);
    const secondaryHex = lightenColor(hex, 25);
    const isLight = isLightColor(hex);
    
    root.style.setProperty('--accent-color', hex);
    root.style.setProperty('--primary', hsl);
    root.style.setProperty('--ring', hsl);
    root.style.setProperty('--brand-primary', hex);
    root.style.setProperty('--brand-dark', darkHex);
    root.style.setProperty('--brand-secondary', secondaryHex);
    root.style.setProperty('--brand-text', isLight ? '#1e293b' : '#ffffff');
    root.style.setProperty('--brand-text-muted', isLight ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)');
    root.setAttribute('data-accent', settings.accentColor === 'custom' ? 'custom' : settings.accentColor);
    root.style.setProperty('--base-font-size', FONT_SIZE_MAP[settings.fontSize] || '16px');
    root.classList.toggle('compact', settings.compactMode);
    root.classList.toggle('no-animations', !settings.animations);
};

export const MainLayout: React.FC = () => {
    const { isLoading, isAuthenticated, logout } = useAuth();
    const { i18n } = useTranslation();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
        return stored === 'true';
    });

    const toggleSidebarCollapsed = () => {
        setSidebarCollapsed(prev => {
            const next = !prev;
            localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
            return next;
        });
    };

    // 路由变化时关闭移动端侧边栏
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    // 监听窗口大小变化，大屏幕时自动关闭移动端侧边栏状态
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ESC键关闭侧边栏
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSidebarOpen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    // 加载并应用外观设置
    useEffect(() => {
        if (isAuthenticated) {
            usersApi.getAppearanceSettings().then(applyAppearance).catch(() => {});
        }
    }, [isAuthenticated]);

    const handleLanguageChange = (lang: Language) => {
        i18n.changeLanguage(lang);
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'zh' : 'en';
        handleLanguageChange(newLang as Language);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            {/* 移动端遮罩层 */}
            <div
                className={`sidebar-overlay lg:hidden ${sidebarOpen ? 'sidebar-overlay-visible' : 'sidebar-overlay-hidden'}`}
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
            />

            {/* 侧边栏 - 桌面端固定，移动端抽屉式 */}
            <aside className={`
                fixed inset-y-0 left-0 z-50
                lg:relative lg:z-auto
                transition-all duration-300 ease-in-out flex-shrink-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <Sidebar
                    language={(i18n.language as Language) || 'zh'}
                    setLanguage={handleLanguageChange}
                    onLogout={logout}
                    onClose={() => setSidebarOpen(false)}
                    collapsed={sidebarCollapsed}
                />
            </aside>

            {/* 主内容区 */}
            <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
                {/* 顶部工具栏 */}
                <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200">
                    <div className="flex items-center px-4 sm:px-6 py-3">
                        {/* 移动端汉堡菜单按钮 */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-brand-primary hover:bg-slate-100 rounded-lg transition-colors touch-target"
                            aria-label="Toggle menu"
                        >
                            {sidebarOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>

                        {/* 移动端Logo - 仅在小屏幕显示 */}
                        <div className="lg:hidden flex-1 text-center">
                            <span className="text-lg font-semibold text-slate-900">Makrite KPI</span>
                        </div>

                        {/* 桌面端折叠按钮 */}
                        <button
                            onClick={toggleSidebarCollapsed}
                            className="hidden lg:flex items-center justify-center p-2 text-slate-500 hover:text-brand-primary hover:bg-slate-100 rounded-lg transition-colors"
                            title={sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
                        >
                            {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                        </button>

                        {/* 占位区域 - 桌面端将右侧工具栏推到最右边 */}
                        <div className="hidden lg:block flex-1" />

                        {/* 右侧工具栏 */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={toggleLanguage}
                                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-sm font-medium text-slate-600 hover:text-brand-primary hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <Languages className="w-4 h-4" />
                                <span className="hidden sm:inline">{i18n.language === 'en' ? '中文' : 'EN'}</span>
                            </button>
                            <NotificationDropdown />
                        </div>
                    </div>
                </div>

                {/* 内容区域 - 响应式内边距，可滚动 */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
