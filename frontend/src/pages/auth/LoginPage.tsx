import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginPage as LoginPageComponent } from '@/components/auth/LoginPage';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Language } from '@/types';

const LoginPage: React.FC = () => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate]);

    const handleSuccess = () => {
        navigate('/', { replace: true });
    };

    if (isLoading) {
        return null;
    }

    if (isAuthenticated) {
        return null;
    }

    return (
        <LoginPageComponent
            language={(i18n.language as Language) || 'zh'}
            onSuccess={handleSuccess}
        />
    );
};

export default LoginPage;
