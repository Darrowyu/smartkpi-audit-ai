import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardBody } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, Download, History, Plus } from 'lucide-react';
import { Language } from '../../types';
import FileUpload from '../FileUpload';

interface ReportsViewProps {
  language: Language;
  onFileSelect: (file: File, period: string) => void;
  isProcessing: boolean;
  error: string | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  language,
  onFileSelect,
  isProcessing,
  error
}) => {
  const { t } = useTranslation();
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('aiAuditReport')}</h1>
          <p className="text-slate-600 mt-1">{t('generateAIReport')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={Plus} onClick={() => { }}>
            {language === 'en' ? 'New Audit' : '标准审计'}
          </Button>
          <Button variant="ghost" icon={History} onClick={() => setShowHistory(!showHistory)}>
            {t('historyRecords')}
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardBody className="p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <FileText className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">{t('uploadData')}</h2>
            <p className="text-slate-600">{t('uploadDesc')}</p>
          </div>

          {/* File Upload Component */}
          <div className="max-w-2xl mx-auto">
            <FileUpload
              onFileSelect={onFileSelect}
              isProcessing={isProcessing}
              error={error}
              language={language}
            />
          </div>

          {/* Supported Formats */}
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{t('supportedFormats')}</span>
            </div>
            <span>•</span>
            <button className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium">
              <Download className="w-4 h-4" />
              <span>{t('downloadSample')}</span>
            </button>
          </div>
        </CardBody>
      </Card>

      {/* History Section (if toggled) */}
      {showHistory && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('historyRecords')}</h3>
            <div className="text-center py-8 text-slate-500">
              {language === 'en' ? 'No history records yet' : '暂无历史记录'}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

