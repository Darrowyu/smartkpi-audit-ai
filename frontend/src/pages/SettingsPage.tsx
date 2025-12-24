import React from 'react';
import ProfileView from '@/components/views/ProfileView';
import { useTranslation } from 'react-i18next';
import { Language } from '@/types';

const SettingsPage: React.FC = () => {
    const { i18n } = useTranslation();

    return (
        <ProfileView
            language={(i18n.language as Language) || 'zh'}
            setLanguage={(lang) => i18n.changeLanguage(lang)}
        />
    );
};

export default SettingsPage;

