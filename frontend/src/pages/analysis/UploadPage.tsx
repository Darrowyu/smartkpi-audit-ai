import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import FileUpload from '@/components/ui/FileUpload';
import { filesApi } from '@/api/files.api';
import { kpiAnalysisApi } from '@/api/kpi-analysis.api';
import { Language } from '@/types';

const UploadPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const language = (i18n.language as Language) || 'zh';

    const handleFileSelect = async (file: File, period: string) => {
        setIsProcessing(true);
        setError(null);
        try {
            const uploadedFile = await filesApi.upload(file);
            const analysis = await kpiAnalysisApi.analyze(uploadedFile.id, language, period);
            navigate(`/analysis/${analysis.id}`); // 跳转到分析详情页
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Upload failed');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <div className="w-full max-w-2xl">
                <button
                    onClick={() => navigate('/')}
                    className="mb-6 text-slate-500 hover:text-primary flex items-center gap-1 text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />{t('backToHome')}
                </button>
                <div className="text-center space-y-2 mb-10">
                    <h2 className="text-3xl font-bold text-slate-900">{t('uploadTitle')}</h2>
                    <p className="text-slate-500">{t('demoTip')}</p>
                </div>
                <FileUpload
                    onFileSelect={handleFileSelect}
                    isProcessing={isProcessing}
                    error={error}
                    language={language}
                />
            </div>
        </div>
    );
};

export default UploadPage;
