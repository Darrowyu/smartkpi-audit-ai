import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Auth pages
const LandingPage = lazy(() => import('@/pages/auth/LandingPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));

// Dashboard
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));

// Analysis
const AnalysisDetailPage = lazy(() => import('@/pages/analysis/AnalysisDetailPage'));
const UploadPage = lazy(() => import('@/pages/analysis/UploadPage'));
const HistoryPage = lazy(() => import('@/pages/analysis/HistoryPage'));

// Assessment & Assignment
const AssessmentPage = lazy(() => import('@/pages/assessment/AssessmentPage'));
const AssignmentPage = lazy(() => import('@/pages/assignment/AssignmentPage'));

// Data Entry
const DataEntryPage = lazy(() => import('@/pages/data-entry/DataEntryPage'));

// Group
const GroupDashboardPage = lazy(() => import('@/pages/group/GroupDashboardPage'));

// KPI Library
const KPILibraryPage = lazy(() => import('@/pages/kpi-library/KPILibraryPage'));

// Permissions
const PermissionsPage = lazy(() => import('@/pages/permissions/PermissionsPage'));

// Reports
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));

// Team
const TeamManagementPage = lazy(() => import('@/pages/team/TeamManagementPage'));

// Profile
const SettingsPage = lazy(() => import('@/pages/profile/SettingsPage'));

// Error
const NotFoundPage = lazy(() => import('@/pages/error/NotFoundPage'));

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
