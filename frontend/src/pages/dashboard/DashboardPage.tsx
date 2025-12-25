import React from 'react';
import { DashboardView } from '@/components/views/dashboard/DashboardView';
import { useTranslation } from 'react-i18next';
import { Language } from '@/types';

const DashboardPage: React.FC = () => {
    const { i18n } = useTranslation();
    return <DashboardView language={(i18n.language as Language) || 'zh'} />;
};

export default DashboardPage;
