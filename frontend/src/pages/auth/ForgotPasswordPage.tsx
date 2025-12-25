import React from 'react';
import { useTranslation } from 'react-i18next';
import { ForgotPasswordPage as ForgotPasswordPageComponent } from '@/components/auth/ForgotPasswordPage';
import { Language } from '@/types';

const ForgotPasswordPage: React.FC = () => {
  const { i18n } = useTranslation();
  return <ForgotPasswordPageComponent language={(i18n.language as Language) || 'zh'} />;
};

export default ForgotPasswordPage;
