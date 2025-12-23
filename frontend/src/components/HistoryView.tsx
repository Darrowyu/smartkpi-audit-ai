import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KPIAnalysisResult } from '../types';
import { kpiAnalysisApi, AnalysisListItem } from '../api/kpi-analysis.api';
import { Calendar, FileText, Trash2, ArrowRight, Clock, Loader2 } from 'lucide-react';

interface HistoryViewProps {
  onSelectResult: (result: KPIAnalysisResult) => void;
  language: 'en' | 'zh';
}

const HistoryView: React.FC<HistoryViewProps> = ({ onSelectResult, language }) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<AnalysisListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await kpiAnalysisApi.getAnalyses(1, 20);
      setHistory(res.data);
    } catch (_e) { /* 加载失败静默处理 */ }
    finally { setLoading(false); }
  };

  const handleSelect = async (id: string) => {
    try {
      const analysis = await kpiAnalysisApi.getAnalysis(id);
      if (analysis.rawResult) onSelectResult(analysis.rawResult);
    } catch (_e) { /* 加载失败静默处理 */ }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm(t('confirmDeleteAnalysis'))) return;
    try {
      await kpiAnalysisApi.deleteAnalysis(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (_e) { /* 删除失败静默处理 */ }
  };

  const formatDate = (dateStr: string) => new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="bg-slate-100 p-6 rounded-full mb-4"><Clock className="w-10 h-10 text-slate-400" /></div>
        <h3 className="text-xl font-bold text-slate-800">{t('noHistory')}</h3>
        <p className="text-slate-500 mt-2">{t('noHistoryDesc')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Clock className="w-6 h-6 text-indigo-600" />{t('history')}</h2>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {history.map((item) => (
            <div key={item.id} onClick={() => handleSelect(item.id)} className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600 group-hover:bg-indigo-100"><FileText className="w-6 h-6" /></div>
                <div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700">{item.file.originalName}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(item.createdAt)}</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs border border-slate-200">{item.period}</span>
                    <span>{item._count.employeeRecords} {t('employee')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 self-end sm:self-center">
                <button className="text-sm font-medium text-indigo-600 opacity-0 group-hover:opacity-100 flex items-center gap-1">{t('viewReport')} <ArrowRight className="w-4 h-4" /></button>
                <button onClick={(e) => handleDelete(e, item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full z-10" title={t('delete')}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HistoryView;
