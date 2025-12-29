import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KPIAnalysisResult, EmployeeKPI, KPIStatus } from '@/types';
import KPITable from '@/components/ui/KPITable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Trophy, TrendingUp, Users, AlertTriangle, Download, Loader2 } from 'lucide-react';
import { exportKPIReport } from '@/utils/pdfExport';

interface DashboardProps {
  data: KPIAnalysisResult;
  onReset: () => void;
}

const COLORS = {
  [KPIStatus.EXCELLENT]: '#10b981',
  [KPIStatus.GOOD]: '#3b82f6',
  [KPIStatus.AVERAGE]: '#f59e0b',
  [KPIStatus.POOR]: '#ef4444',
};

const Dashboard: React.FC<DashboardProps> = ({ data, onReset }) => {
  const { t, i18n } = useTranslation();
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeKPI | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const getStatusLabel = (status: KPIStatus): string => {
    const statusMap: Record<KPIStatus, string> = {
      [KPIStatus.EXCELLENT]: t('statusExcellent'),
      [KPIStatus.GOOD]: t('statusGood'),
      [KPIStatus.AVERAGE]: t('statusAverage'),
      [KPIStatus.POOR]: t('statusPoor'),
    };
    return statusMap[status] || status;
  };

  const totalEmployees = data.employees.length;
  const avgScore = data.employees.reduce((acc, emp) => acc + emp.totalScore, 0) / totalEmployees;
  const topPerformer = [...data.employees].sort((a, b) => b.totalScore - a.totalScore)[0];
  const lowPerformer = [...data.employees].sort((a, b) => a.totalScore - b.totalScore)[0];

  const statusCounts = data.employees.reduce((acc, emp) => { acc[emp.status] = (acc[emp.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  const pieData = Object.keys(statusCounts).map(status => ({ name: status, displayName: getStatusLabel(status as KPIStatus), value: statusCounts[status] }));
  const barData = data.employees.map(emp => ({ name: emp.name.split(' ')[0], score: emp.totalScore, status: emp.status }));

  const language = i18n.language === 'zh' ? 'zh' : 'en';

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportKPIReport(data, language);
    } catch (_e) { alert("Export failed"); }
    finally { setIsExporting(false); }
  };

  return (
    <div className="space-y-8 bg-slate-50 p-2 sm:p-4 rounded-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{t('reportTitle')}</h2>
          <p className="text-slate-500">{t('period')}: <span className="font-semibold text-primary">{data.period}</span></p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm disabled:opacity-50">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}{isExporting ? "..." : t('exportPDF')}
          </button>
          <button onClick={onReset} className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-sm">{t('uploadNew')}</button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 shadow-sm">
        <h3 className="text-slate-900 font-semibold mb-2 flex items-center gap-2">
          <span className="bg-brand-primary text-brand-text text-xs px-2 py-0.5 rounded-full">{t('aiInsight')}</span>{t('execSummary')}
        </h3>
        <p className="text-slate-700 leading-relaxed">{data.summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('teamAvg')} value={avgScore.toFixed(1)} suffix="%" icon={<TrendingUp className="w-5 h-5 text-primary" />} color="bg-primary/10 border-primary/20" />
        <StatCard title={t('totalEmp')} value={totalEmployees} icon={<Users className="w-5 h-5 text-slate-600" />} color="bg-slate-50 border-slate-100" />
        <StatCard title={t('topPerf')} value={topPerformer?.name || "N/A"} subValue={`${topPerformer?.totalScore}%`} icon={<Trophy className="w-5 h-5 text-emerald-600" />} color="bg-emerald-50 border-emerald-100" />
        <StatCard title={t('lowPerf')} value={lowPerformer?.name || "N/A"} subValue={`${lowPerformer?.totalScore}%`} icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} color="bg-amber-50 border-amber-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">{t('perfDist')}</h3>
          <div style={{ width: '100%', height: 256 }}>
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>{barData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.status as KPIStatus] || '#cbd5e1'} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">{t('ratingBreakdown')}</h3>
          <div style={{ width: '100%', height: 256 }}>
            <ResponsiveContainer width="100%" height={256}>
              <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name as KPIStatus] || '#cbd5e1'} />)}</Pie><Tooltip formatter={(value, _name, props) => [value, props.payload.displayName]} /></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-sm mt-4">{Object.keys(statusCounts).map(status => <div key={status} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[status as KPIStatus] }}></div><span className="text-slate-600">{getStatusLabel(status as KPIStatus)}</span></div>)}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100"><h3 className="text-lg font-semibold text-slate-800">{t('detailedRecords')}</h3></div>
        <KPITable employees={data.employees} onSelectEmployee={setSelectedEmployee} selectedEmployeeId={selectedEmployee?.id} />
      </div>

      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-slate-100 flex justify-between items-center z-10">
              <div><h3 className="text-2xl font-bold text-slate-800">{selectedEmployee.name}</h3><p className="text-slate-500 text-sm">{selectedEmployee.role} • {selectedEmployee.department}</p></div>
              <button onClick={() => setSelectedEmployee(null)} className="p-2 hover:bg-slate-100 rounded-full"><svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">{t('perfAnalysis')}</h4><p className="text-slate-700">{selectedEmployee.aiAnalysis}</p></div>
              <div><h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">{t('metricBreakdown')}</h4>
                <div className="space-y-4">{selectedEmployee.metrics.map((metric, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-300 bg-white shadow-sm">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1"><span className="font-semibold text-slate-800">{metric.name}</span><span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">{t('weight')}: {metric.weight}%</span></div>
                      <p className="text-sm text-slate-500 mb-2">{metric.comment}</p>
                      <div className="flex gap-4 text-sm"><div className="flex flex-col"><span className="text-slate-400 text-xs uppercase">{t('target')}</span><span className="font-medium text-slate-700">{metric.targetValue}</span></div><div className="flex flex-col"><span className="text-slate-400 text-xs uppercase">{t('actual')}</span><span className="font-medium text-slate-900">{metric.actualValue}</span></div></div>
                    </div>
                    <div className="sm:w-24 flex flex-col items-center justify-center border-l border-slate-100 sm:pl-4"><span className="text-xs text-slate-400 uppercase">{t('score')}</span><span className={`text-2xl font-bold ${metric.score >= 100 ? 'text-emerald-600' : metric.score >= 80 ? 'text-primary' : metric.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{metric.score}</span></div>
                  </div>
                ))}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, suffix, icon, color }) => (
  <div className={`p-5 rounded-xl border ${color} shadow-sm`}>
    <div className="flex justify-between items-start mb-2"><span className="text-slate-500 text-sm font-medium">{title}</span>{icon}</div>
    <div className="flex items-baseline gap-2"><h4 className="text-2xl font-bold text-slate-800">{value}<span className="text-lg text-slate-400 font-normal">{suffix}</span></h4>{subValue && <span className="text-sm font-medium text-slate-500">({subValue})</span>}</div>
  </div>
);

export default Dashboard;
