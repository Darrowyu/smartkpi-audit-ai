import React from 'react';
import { useTranslation } from 'react-i18next';
import HistoryViewComponent from '@/components/HistoryView';
import { Language } from '@/types';

const HistoryPage: React.FC = () => {
    const { i18n } = useTranslation();

    return (
        <HistoryViewComponent language={(i18n.language as Language) || 'zh'} />
    );
};

export default HistoryPage;
