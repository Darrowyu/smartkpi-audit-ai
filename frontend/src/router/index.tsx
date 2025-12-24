import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProtectedRoute } from '@/components/ProtectedRoute';

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
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const AnalysisDetailPage = lazy(() => import('@/pages/AnalysisDetailPage'));

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
        path: '/forgot-password',
        element: <SuspenseWrapper><ForgotPasswordPage /></SuspenseWrapper>,
    },
    {
        path: '/reset-password',
        element: <SuspenseWrapper><ResetPasswordPage /></SuspenseWrapper>,
    },
    {
        path: '/',
        element: <MainLayout />,
        children: [
            { index: true, element: <SuspenseWrapper><LandingPage /></SuspenseWrapper> },
            { path: 'dashboard', element: <ProtectedRoute permission="report:view"><SuspenseWrapper><DashboardPage /></SuspenseWrapper></ProtectedRoute> },
            { path: 'kpi-library', element: <ProtectedRoute permission="kpi:view"><SuspenseWrapper><KPILibraryPage /></SuspenseWrapper></ProtectedRoute> },
            { path: 'assessment', element: <ProtectedRoute permission="period:view"><SuspenseWrapper><AssessmentPage /></SuspenseWrapper></ProtectedRoute> },
            { path: 'assignment', element: <ProtectedRoute permission="period:view" adminOnly><SuspenseWrapper><AssignmentPage /></SuspenseWrapper></ProtectedRoute> },
            { path: 'data-entry', element: <ProtectedRoute permission="data:view"><SuspenseWrapper><DataEntryPage /></SuspenseWrapper></ProtectedRoute> },
            { path: 'reports', element: <ProtectedRoute permission="report:view"><SuspenseWrapper><ReportsPage /></SuspenseWrapper></ProtectedRoute> },
            { path: 'team', element: <ProtectedRoute permission="user:view" adminOnly><SuspenseWrapper><TeamManagementPage /></SuspenseWrapper></ProtectedRoute> },
            { path: 'permissions', element: <ProtectedRoute permission="settings:view" adminOnly><SuspenseWrapper><PermissionsPage /></SuspenseWrapper></ProtectedRoute> },
            { path: 'group-dashboard', element: <ProtectedRoute adminOnly><SuspenseWrapper><GroupDashboardPage /></SuspenseWrapper></ProtectedRoute> },
            { path: 'settings', element: <SuspenseWrapper><SettingsPage /></SuspenseWrapper> },
            { path: 'upload', element: <ProtectedRoute permission="data:submit"><SuspenseWrapper><UploadPage /></SuspenseWrapper></ProtectedRoute> },
            { path: 'history', element: <ProtectedRoute permission="report:view"><SuspenseWrapper><HistoryPage /></SuspenseWrapper></ProtectedRoute> },
            { path: 'analysis/:id', element: <ProtectedRoute permission="report:view"><SuspenseWrapper><AnalysisDetailPage /></SuspenseWrapper></ProtectedRoute> },
            { path: '404', element: <SuspenseWrapper><NotFoundPage /></SuspenseWrapper> },
            { path: '*', element: <Navigate to="/404" replace /> },
        ],
    },
]);

