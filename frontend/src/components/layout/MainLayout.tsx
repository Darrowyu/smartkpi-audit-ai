import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTranslation } from 'react-i18next';
import { Language } from '@/types';
import { Languages } from 'lucide-react';

export const MainLayout: React.FC = () => {
    const { isLoading, isAuthenticated, logout } = useAuth();
    const { i18n } = useTranslation();

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
        <div className="flex min-h-screen bg-slate-100">
            <Sidebar
                language={(i18n.language as Language) || 'zh'}
                setLanguage={handleLanguageChange}
                onLogout={logout}
            />
            <main className="flex-1 ml-64">
                {/* Top Bar */}
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-3">
                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#1E4B8E] hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Languages className="w-4 h-4" />
                            <span>{i18n.language === 'en' ? '中文' : 'EN'}</span>
                        </button>
                        <NotificationDropdown />
                    </div>
                </div>
                {/* Content */}
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
