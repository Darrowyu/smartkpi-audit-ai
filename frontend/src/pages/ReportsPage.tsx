import React from 'react';
import { ReportsView } from '@/components/views/ReportsView';
import { useTranslation } from 'react-i18next';
import { Language } from '@/types';

const ReportsPage: React.FC = () => {
    const { i18n } = useTranslation();
    return (
        <ReportsView
            language={(i18n.language as Language) || 'zh'}
            onFileSelect={() => { }}
            isProcessing={false}
            error={null}
        />
    );
};

export default ReportsPage;
