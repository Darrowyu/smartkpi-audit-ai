import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy loaded pages for code splitting
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const KPILibraryPage = lazy(() => import('@/pages/KPILibraryPage'));
const AssessmentPage = lazy(() => import('@/pages/AssessmentPage'));
const AssignmentPage = lazy(() => import('@/pages/AssignmentPage'));
const DataEntryPage = lazy(() => import('@/pages/DataEntryPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const TeamManagementPage = lazy(() => import('@/pages/TeamManagementPage'));
const PermissionsPage = lazy(() => import('@/pages/PermissionsPage'));
const GroupDashboardPage = lazy(() => import('@/pages/GroupDashboardPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const UploadPage = lazy(() => import('@/pages/UploadPage'));
const HistoryPage = lazy(() => import('@/pages/HistoryPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
        {children}
    </Suspense>
);

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <SuspenseWrapper><LoginPage /></SuspenseWrapper>,
    },
    {
        path: '/',
        element: <MainLayout />,
        children: [
            { index: true, element: <SuspenseWrapper><LandingPage /></SuspenseWrapper> },
            { path: 'dashboard', element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper> },
            { path: 'kpi-library', element: <SuspenseWrapper><KPILibraryPage /></SuspenseWrapper> },
            { path: 'assessment', element: <SuspenseWrapper><AssessmentPage /></SuspenseWrapper> },
            { path: 'assignment', element: <SuspenseWrapper><AssignmentPage /></SuspenseWrapper> },
            { path: 'data-entry', element: <SuspenseWrapper><DataEntryPage /></SuspenseWrapper> },
            { path: 'reports', element: <SuspenseWrapper><ReportsPage /></SuspenseWrapper> },
            { path: 'team', element: <SuspenseWrapper><TeamManagementPage /></SuspenseWrapper> },
            { path: 'permissions', element: <SuspenseWrapper><PermissionsPage /></SuspenseWrapper> },
            { path: 'group-dashboard', element: <SuspenseWrapper><GroupDashboardPage /></SuspenseWrapper> },
            { path: 'settings', element: <SuspenseWrapper><SettingsPage /></SuspenseWrapper> },
            { path: 'upload', element: <SuspenseWrapper><UploadPage /></SuspenseWrapper> },
            { path: 'history', element: <SuspenseWrapper><HistoryPage /></SuspenseWrapper> },
            { path: '404', element: <SuspenseWrapper><NotFoundPage /></SuspenseWrapper> },
            { path: '*', element: <Navigate to="/404" replace /> },
        ],
    },
]);
