import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTranslation } from 'react-i18next';
import { Language } from '@/types';
import { Languages, Menu, X, PanelLeftClose, PanelLeft, Sun, Moon } from 'lucide-react';
import { usersApi, type AppearanceSettings } from '@/api/users.api';
import { applyAppearanceSettings, isDefaultAppearanceSettings, readCachedAppearanceSettings } from '@/utils/appearance';

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';
const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)';

export const MainLayout: React.FC = () => {
    const { isLoading, isAuthenticated, logout } = useAuth();
    const { i18n } = useTranslation();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
        return stored === 'true';
    });

    const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings | null>(() => readCachedAppearanceSettings());
    const [systemPrefersDark, setSystemPrefersDark] = useState(() => window.matchMedia(SYSTEM_DARK_QUERY).matches);
    const themeSavingRef = useRef(false);

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
        if (!isAuthenticated) return;

        const cached = readCachedAppearanceSettings();
        if (cached) {
            setAppearanceSettings(cached);
            applyAppearanceSettings(cached);
        }

        usersApi.getAppearanceSettings().then((server) => {
            if (cached && isDefaultAppearanceSettings(server) && !isDefaultAppearanceSettings(cached)) {
                usersApi.updateAppearanceSettings(cached).catch(() => {});
                return;
            }
            setAppearanceSettings(server);
            applyAppearanceSettings(server);
        }).catch(() => {});
    }, [isAuthenticated]);

    useEffect(() => {
        const mql = window.matchMedia(SYSTEM_DARK_QUERY);
        const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
        if (typeof mql.addEventListener === 'function') mql.addEventListener('change', handler);
        else mql.addListener(handler);
        return () => {
            if (typeof mql.removeEventListener === 'function') mql.removeEventListener('change', handler);
            else mql.removeListener(handler);
        };
    }, []);

    const isDark = appearanceSettings
        ? (appearanceSettings.theme === 'dark' || (appearanceSettings.theme === 'system' && systemPrefersDark))
        : systemPrefersDark;

    const handleToggleTheme = useCallback(() => {
        if (themeSavingRef.current) return;

        const current = readCachedAppearanceSettings() || appearanceSettings;
        if (!current) return;

        const currentIsDark = current.theme === 'dark' || (current.theme === 'system' && systemPrefersDark);
        const nextTheme: AppearanceSettings['theme'] = currentIsDark ? 'light' : 'dark';
        const next: AppearanceSettings = { ...current, theme: nextTheme };
        const prev: AppearanceSettings = current;

        setAppearanceSettings(next);
        applyAppearanceSettings(next);

        themeSavingRef.current = true;
        usersApi.updateAppearanceSettings(next).then((saved) => {
            setAppearanceSettings(saved);
            applyAppearanceSettings(saved);
        }).catch(() => {
            setAppearanceSettings(prev);
            applyAppearanceSettings(prev);
        }).finally(() => {
            themeSavingRef.current = false;
        });
    }, [appearanceSettings, systemPrefersDark]);

    const handleLanguageChange = (lang: Language) => {
        i18n.changeLanguage(lang);
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'zh' : 'en';
        handleLanguageChange(newLang as Language);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* 移动端遮罩层 */}
            <div
                className={`sidebar-overlay lg:hidden ${sidebarOpen ? 'sidebar-overlay-visible' : 'sidebar-overlay-hidden'}`}
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
            />

            {/* 侧边栏 - 桌面端固定，移动端抽屉式 */}
            <aside className={`
                fixed inset-y-0 left-0 z-50
                lg:relative lg:z-40
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
                <div className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border">
                    <div className="flex items-center px-4 sm:px-6 py-3">
                        {/* 移动端汉堡菜单按钮 */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors touch-target"
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
                            <span className="text-lg font-semibold text-foreground">Makrite KPI</span>
                        </div>

                        {/* 桌面端折叠按钮 */}
                        <button
                            onClick={toggleSidebarCollapsed}
                            className="hidden lg:flex items-center justify-center p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
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
                                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                            >
                                <Languages className="w-4 h-4" />
                                <span className="hidden sm:inline">{i18n.language === 'en' ? '中文' : 'EN'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleToggleTheme}
                                className="flex items-center justify-center p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors touch-target"
                                aria-label={i18n.language === 'zh' ? '切换主题' : 'Toggle theme'}
                                title={i18n.language === 'zh' ? '切换主题' : 'Toggle theme'}
                            >
                                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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
