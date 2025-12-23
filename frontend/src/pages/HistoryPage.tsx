import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HistoryViewComponent from '@/components/HistoryView';
import { Language, KPIAnalysisResult } from '@/types';

const HistoryPage: React.FC = () => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();

    const handleSelectResult = (_result: KPIAnalysisResult) => {
        navigate('/dashboard');
    };

    return (
        <HistoryViewComponent
            onSelectResult={handleSelectResult}
            language={(i18n.language as Language) || 'zh'}
        />
    );
};

export default HistoryPage;
