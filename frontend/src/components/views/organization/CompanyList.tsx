import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { companiesApi, Company, CreateCompanyData } from '@/api/companies.api';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/use-toast';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Language } from '@/types';
import { Building2, Plus, Edit, Trash2, Search, RefreshCw, Users, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  language: Language;
}

const CompanyList: React.FC<Props> = ({ language }) => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateCompanyData>({
    name: '',
    code: '',
    domain: '',
    settings: {},
  });

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await companiesApi.getCompanies({ limit: 100, search: search || undefined });
      setCompanies(res.data);
    } catch {
      toast({ variant: 'destructive', title: '加载子公司失败' });
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => { loadCompanies(); }, [loadCompanies]);

  const sortedCompanies = React.useMemo(() => {
    return [...companies].sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  }, [companies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCompany) {
        await companiesApi.updateCompanyById(editingCompany.id, formData);
        toast({ title: '更新成功' });
      } else {
        await companiesApi.createCompany(formData);
        toast({ title: '创建成功' });
      }
      setShowModal(false);
      setEditingCompany(null);
      setFormData({ name: '', code: '', domain: '', settings: {} });
      loadCompanies();
    } catch (e: any) {
      toast({ variant: 'destructive', title: e.response?.data?.message || '操作失败' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      code: company.code || '',
      domain: company.domain || '',
      settings: company.settings || {},
    });
    setShowModal(true);
  };

  const handleDelete = async (company: Company) => {
    const confirmed = await confirm({
      title: t('common.confirm'),
      description: t('confirmDeleteCompany', { name: company.name }),
      variant: 'destructive',
    });
    if (!confirmed) return;
    try {
      await companiesApi.deleteCompany(company.id);
      toast({ title: '删除成功' });
      loadCompanies();
    } catch (e: any) {
      toast({ variant: 'destructive', title: e.response?.data?.message || t('deleteFailed') });
    }
  };

  const openCreateModal = () => {
    setEditingCompany(null);
    setFormData({ name: '', code: '', domain: '', settings: {} });
    setShowModal(true);
  };

  return (
    <div>
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          {t('companyManagement')}
          <Badge variant="secondary">{companies.length}</Badge>
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadCompanies} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            {t('addCompany')}
          </Button>
        </div>
      </div>

      {/* 搜索 */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder={t('searchCompanies')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 表格 */}
      {loading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : sortedCompanies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="暂无子公司"
          description={search ? '没有找到匹配的子公司' : '点击上方按钮添加第一个子公司'}
          action={!search ? <Button onClick={openCreateModal}><Plus className="w-4 h-4 mr-2" />添加子公司</Button> : undefined}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase w-12">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('companyName')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('companyCode')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('domain')}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">{t('user')}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">{t('departments')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {sortedCompanies.map((company, index) => (
                <tr key={company.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-400">{index + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900">{company.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <code className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">{company.code || '-'}</code>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{company.domain || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="secondary" className="bg-violet-100 text-violet-700 hover:bg-violet-100">
                      <Users className="w-3 h-3 mr-1" />
                      {company._count?.users || 0}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="secondary" className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100">
                      <Layers className="w-3 h-3 mr-1" />
                      {company._count?.departments || 0}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(company)} className="h-8 w-8">
                        <Edit className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(company)} className="h-8 w-8 hover:text-red-600">
                        <Trash2 className="w-4 h-4 text-slate-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 添加/编辑对话框 */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCompany ? t('editCompany') : t('addCompany')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('companyName')} <span className="text-red-500">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="请输入子公司名称"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('companyCode')} <span className="text-red-500">*</span></Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                placeholder="DG001"
                className="font-mono"
              />
              <p className="text-xs text-slate-500">{t('companyCodeHint')}</p>
            </div>
            <div className="space-y-2">
              <Label>{t('domain')}</Label>
              <Input
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="dongguan.makrite.com"
              />
              <p className="text-xs text-slate-500">{t('domainHintOptional')}</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? '保存中...' : (editingCompany ? t('update') : t('create'))}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyList;
