import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { kpiAnalysisApi, AnalysisListItem } from '@/api/kpi-analysis.api';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Calendar, FileText, Trash2, ArrowRight, Clock, Loader2 } from 'lucide-react';
import { Language } from '@/types';

interface HistoryViewProps {
  onSelectResult?: (result: unknown) => void; // 保留但改为可选
  language: Language;
}

const HistoryView: React.FC<HistoryViewProps> = ({ language }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [history, setHistory] = useState<AnalysisListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const res = await kpiAnalysisApi.getAnalyses(1, 20);
      setHistory(res.data);
    } catch { /* 静默处理 */ }
    finally { setLoading(false); }
  };

  const handleSelect = (id: string) => { // 修改：直接导航到详情页
    navigate(`/analysis/${id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: t('common.confirm'),
      description: t('confirmDeleteAnalysis'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    try {
      await kpiAnalysisApi.deleteAnalysis(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch { /* 静默处理 */ }
  };

  const formatDate = (dateStr: string) => new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

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
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Clock className="w-6 h-6 text-primary" />{t('history')}</h2>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {history.map((item) => (
            <div key={item.id} onClick={() => handleSelect(item.id)} className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg text-primary group-hover:bg-primary/20"><FileText className="w-6 h-6" /></div>
                <div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-primary">{item.file.originalName}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(item.createdAt)}</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs border border-slate-200">{item.period}</span>
                    <span>{item._count.employeeRecords} {t('employee')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 self-end sm:self-center">
                <button className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 flex items-center gap-1">{t('viewReport')} <ArrowRight className="w-4 h-4" /></button>
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
