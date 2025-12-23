import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginPage as LoginPageComponent } from '@/components/auth/LoginPage';
import { useTranslation } from 'react-i18next';
import { Language } from '@/types';

const LoginPage: React.FC = () => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();

    const handleSuccess = () => {
        navigate('/');
    };

    return (
        <LoginPageComponent
            language={(i18n.language as Language) || 'zh'}
            onSuccess={handleSuccess}
        />
    );
};

export default LoginPage;
