import React, { useCallback, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Loader2, AlertCircle, FileDown } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/i18n';
import { downloadTemplate } from '../services/excelService';

interface FileUploadProps {
  onFileSelect: (file: File, period: string) => void;
  isProcessing: boolean;
  error: string | null;
  language: Language;
  t: typeof translations['en'];
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing, error, language, t }) => {
  const [dragActive, setDragActive] = useState(false);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    const q = Math.ceil((now.getMonth() + 1) / 3);
    return `Q${q} ${now.getFullYear()}`;
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) validateAndPass(e.dataTransfer.files[0]);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndPass(e.target.files[0]);
  };

  const validateAndPass = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      alert("Please upload an Excel or CSV file.");
      return;
    }
    onFileSelect(file, period);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div
        className={`relative group border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${dragActive ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-slate-300 bg-white hover:border-slate-400'} ${isProcessing ? 'opacity-80 pointer-events-none' : ''}`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          {isProcessing ? (
            <div className="flex flex-col items-center animate-pulse">
              <div className="p-4 bg-blue-100 rounded-full mb-2"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
              <h3 className="text-lg font-semibold text-slate-700">{t.analyzing}</h3>
              <p className="text-slate-500 text-sm max-w-xs">{t.analyzingDesc}</p>
            </div>
          ) : (
            <>
              <div className={`p-4 rounded-full transition-colors ${dragActive ? 'bg-blue-100' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                <UploadCloud className={`w-8 h-8 ${dragActive ? 'text-blue-600' : 'text-slate-500'}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-700">{dragActive ? t.dropFile : t.uploadTitle}</h3>
                <p className="text-slate-500 text-sm mt-1">{t.dragDrop}</p>
              </div>
            </>
          )}
          <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" onChange={handleChange} accept=".xlsx, .xls, .csv" disabled={isProcessing} />
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /><p className="text-sm">{error}</p>
        </div>
      )}

      {/* 考核周期选择 */}
      <div className="mt-6 bg-white p-4 rounded-lg border border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-2">{language === 'zh' ? '考核周期' : 'Assessment Period'}</label>
        <div className="flex gap-2">
          <select value={period.split(' ')[0]} onChange={(e) => setPeriod(`${e.target.value} ${period.split(' ')[1]}`)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500">
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4">Q4</option>
          </select>
          <select value={period.split(' ')[1]} onChange={(e) => setPeriod(`${period.split(' ')[0]} ${e.target.value}`)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500">
            {[...Array(5)].map((_, i) => { const y = new Date().getFullYear() - 2 + i; return <option key={y} value={y}>{y}</option>; })}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-slate-400" /><span>{t.supportedFormats}</span></div>
        <button onClick={() => downloadTemplate(language)} className="flex items-center gap-2 text-blue-600 font-medium hover:text-blue-800 px-3 py-1.5 rounded-md">
          <FileDown className="w-4 h-4" />{t.downloadTemplate}
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
