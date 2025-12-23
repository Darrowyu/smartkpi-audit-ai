import React from 'react';
import { TeamManagementView } from '@/components/views/TeamManagementView';
import { useTranslation } from 'react-i18next';
import { Language } from '@/types';

const TeamManagementPage: React.FC = () => {
    const { i18n } = useTranslation();
    return <TeamManagementView language={(i18n.language as Language) || 'zh'} />;
};

export default TeamManagementPage;
