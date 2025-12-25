import React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionCard } from '../components/SectionCard';

interface PlaceholderTabProps {
  title: string;
  subtitle: string;
}

export const PlaceholderTab: React.FC<PlaceholderTabProps> = ({ title, subtitle }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>
      <SectionCard>
        <div className="p-6 text-center">
          <div className="text-slate-400">{t('common.comingSoon', '功能开发中...')}</div>
        </div>
      </SectionCard>
    </div>
  );
};
