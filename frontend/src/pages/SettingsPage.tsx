import React from 'react';
import SettingsViewComponent from '@/components/SettingsView';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Language } from '@/types';

const SettingsPage: React.FC = () => {
    const { i18n } = useTranslation();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <SettingsViewComponent
            language={(i18n.language as Language) || 'zh'}
            setLanguage={(lang) => i18n.changeLanguage(lang)}
            onLogout={handleLogout}
        />
    );
};

export default SettingsPage;
