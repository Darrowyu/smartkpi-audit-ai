import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus, MoreHorizontal } from 'lucide-react';
import { Language, KPIStatus } from '@/types';

interface KPIManagementViewProps {
  language: Language;
}

// 模拟KPI数据
const mockKPIs = [
  { id: '1', name: 'Total Revenue', category: 'Financial', current: '1,250,000 USD', target: '1,000,000 USD', status: 'Excellent' as KPIStatus, owner: 'Sarah Chen' },
  { id: '2', name: 'Customer Churn Rate', category: 'Sales', current: '2.5 %', target: '5 %', status: 'Good' as KPIStatus, owner: 'Sarah Chen' },
  { id: '3', name: 'Employee Satisfaction', category: 'HR', current: '7.8 Score', target: '8.5 Score', status: 'Average' as KPIStatus, owner: 'Admin User' },
  { id: '4', name: 'Code Coverage', category: 'Engineering', current: '92 %', target: '90 %', status: 'Excellent' as KPIStatus, owner: 'Mike Ross' },
  { id: '5', name: 'Server Uptime', category: 'IT', current: '99.8 %', target: '99.9 %', status: 'Average' as KPIStatus, owner: 'Mike Ross' },
];

const statusVariantMap: Record<KPIStatus, 'success' | 'info' | 'warning' | 'danger'> = {
  [KPIStatus.EXCELLENT]: 'success',
  [KPIStatus.GOOD]: 'info',
  [KPIStatus.AVERAGE]: 'warning',
  [KPIStatus.POOR]: 'danger',
};

export const KPIManagementView: React.FC<KPIManagementViewProps> = ({ language }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredKPIs = mockKPIs.filter(kpi =>
    kpi.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('kpiManagement')}</h1>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardBody className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:max-w-md">
            <Input
              type="text"
              placeholder={t('searchKPI')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" icon={Filter}>
              {t('filter')}
            </Button>
            <Button variant="primary" icon={Plus}>
              {t('createKPI')}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* KPI Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('kpiName')} <span className="text-slate-400 ml-1">↕</span></TableHead>
              <TableHead>{t('category')}</TableHead>
              <TableHead>{t('currentValue')}</TableHead>
              <TableHead>{t('targetValue')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('owner')}</TableHead>
              <TableHead>{t('operations')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredKPIs.map((kpi) => (
              <TableRow key={kpi.id}>
                <TableCell>
                  <div className="font-medium text-slate-900">{kpi.name}</div>
                </TableCell>
                <TableCell>
                  <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">
                    {kpi.category}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-slate-900">{kpi.current}</span>
                </TableCell>
                <TableCell>
                  <span className="text-slate-600">{kpi.target}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariantMap[kpi.status as KPIStatus]}>
                    {getStatusLabel(kpi.status as KPIStatus)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-slate-900">{kpi.owner}</span>
                </TableCell>
                <TableCell>
                  <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-slate-600" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

