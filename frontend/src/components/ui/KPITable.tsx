import React from 'react';
import { useTranslation } from 'react-i18next';
import { EmployeeKPI, KPIStatus } from '@/types';
import { ChevronRight } from 'lucide-react';

interface KPITableProps {
  employees: EmployeeKPI[];
  onSelectEmployee: (emp: EmployeeKPI) => void;
  selectedEmployeeId?: string;
}

const statusStyles = {
  [KPIStatus.EXCELLENT]: "bg-emerald-100 text-emerald-700 border-emerald-200",
  [KPIStatus.GOOD]: "bg-primary/10 text-primary border-primary/20",
  [KPIStatus.AVERAGE]: "bg-amber-100 text-amber-700 border-amber-200",
  [KPIStatus.POOR]: "bg-red-100 text-red-700 border-red-200",
};

const KPITable: React.FC<KPITableProps> = ({ employees, onSelectEmployee }) => {
  const { t } = useTranslation();

  const getStatusLabel = (status: KPIStatus): string => {
    const statusMap: Record<KPIStatus, string> = {
      [KPIStatus.EXCELLENT]: t('statusExcellent'),
      [KPIStatus.GOOD]: t('statusGood'),
      [KPIStatus.AVERAGE]: t('statusAverage'),
      [KPIStatus.POOR]: t('statusPoor'),
    };
    return statusMap[status] || status;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <th className="px-6 py-4">{t('employee')}</th>
            <th className="px-6 py-4">{t('dept')}</th>
            <th className="px-6 py-4 text-center">{t('metricsCount')}</th>
            <th className="px-6 py-4">{t('totalScore')}</th>
            <th className="px-6 py-4">{t('status')}</th>
            <th className="px-6 py-4 text-right">{t('action')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {employees.map((emp) => (
            <tr key={emp.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onSelectEmployee(emp)}>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900">{emp.name}</span>
                  <span className="text-xs text-slate-500">{emp.role}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-slate-600 text-sm">{emp.department}</td>
              <td className="px-6 py-4 text-center text-slate-600 text-sm">
                <span className="inline-flex items-center justify-center px-2 py-1 bg-slate-100 rounded-full text-xs font-medium">{emp.metrics.length}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${emp.totalScore >= 90 ? 'bg-emerald-500' : emp.totalScore >= 75 ? 'bg-brand-primary' : emp.totalScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(emp.totalScore, 100)}%` }}></div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{emp.totalScore}%</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[emp.status as KPIStatus]}`}>
                  {getStatusLabel(emp.status as KPIStatus)}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-slate-400 hover:text-primary transition-colors"><ChevronRight className="w-5 h-5" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default KPITable;
