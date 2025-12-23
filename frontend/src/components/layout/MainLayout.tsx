import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTranslation } from 'react-i18next';
import { Language } from '@/types';

export const MainLayout: React.FC = () => {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const { i18n } = useTranslation();

    const handleLanguageChange = (lang: Language) => {
        i18n.changeLanguage(lang);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar
                language={(i18n.language as Language) || 'zh'}
                setLanguage={handleLanguageChange}
                onLogout={logout}
            />
            <main className="flex-1 ml-64 p-8">
                <div className="flex justify-end mb-4">
                    <NotificationDropdown />
                </div>
                <Outlet />
            </main>
        </div>
    );
};
