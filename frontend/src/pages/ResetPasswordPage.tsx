import React from 'react';
import { useTranslation } from 'react-i18next';
import { ResetPasswordPage as ResetPasswordPageComponent } from '@/components/auth/ResetPasswordPage';
import { Language } from '@/types';

const ResetPasswordPage: React.FC = () => {
  const { i18n } = useTranslation();
  return <ResetPasswordPageComponent language={(i18n.language as Language) || 'zh'} />;
};

export default ResetPasswordPage;
