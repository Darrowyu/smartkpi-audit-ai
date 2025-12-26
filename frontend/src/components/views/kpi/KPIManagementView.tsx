import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus, MoreHorizontal, Loader2 } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Language, KPIStatus, KPIDefinition } from '@/types';
import { kpiLibraryApi } from '@/api/kpi-library.api';
import { useToast } from '@/components/ui/use-toast';

interface KPIManagementViewProps {
  language: Language;
}

interface KPIDisplayItem {
  id: string;
  name: string;
  category: string;
  current: string;
  target: string;
  status: KPIStatus;
  owner: string;
}

const statusVariantMap: Record<KPIStatus, 'success' | 'info' | 'warning' | 'danger'> = {
  [KPIStatus.EXCELLENT]: 'success',
  [KPIStatus.GOOD]: 'info',
  [KPIStatus.AVERAGE]: 'warning',
  [KPIStatus.POOR]: 'danger',
};

const getCategoryFromCode = (code: string): string => {
  const prefix = code.split('-')[0]?.toUpperCase() || '';
  const categoryMap: Record<string, string> = {
    FIN: 'Financial', CUS: 'Sales', OPS: 'Operations',
    MKT: 'Marketing', HR: 'HR', RND: 'Engineering',
  };
  return categoryMap[prefix] || 'Other';
};

export const KPIManagementView: React.FC<KPIManagementViewProps> = ({ language }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [kpis, setKpis] = useState<KPIDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadKPIs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await kpiLibraryApi.findAll({ search: searchQuery });
      const data = res.data || res || [];
      const mapped: KPIDisplayItem[] = data.map((kpi: KPIDefinition) => ({
        id: kpi.id,
        name: kpi.name,
        category: getCategoryFromCode(kpi.code),
        current: '-',
        target: `${kpi.defaultWeight || 0} %`,
        status: kpi.isActive ? KPIStatus.GOOD : KPIStatus.AVERAGE,
        owner: '-',
      }));
      setKpis(mapped);
    } catch {
      toast({ variant: 'destructive', title: t('common.loadFailed') });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, toast, t]);

  useEffect(() => {
    const timer = setTimeout(() => loadKPIs(), 300);
    return () => clearTimeout(timer);
  }, [loadKPIs]);

  const filteredKPIs = kpis;

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
        {loading ? (
          <div className="p-4"><TableSkeleton rows={5} columns={6} /></div>
        ) : (
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
        )}
      </Card>
    </div>
  );
};

