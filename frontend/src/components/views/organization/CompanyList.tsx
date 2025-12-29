import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { companiesApi, Company, CreateCompanyData } from '@/api/companies.api';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Language } from '@/types';
import { Building2, Plus, Edit, Trash2, Search } from 'lucide-react';

interface Props {
  language: Language;
}

const CompanyList: React.FC<Props> = ({ language }) => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState<CreateCompanyData>({
    name: '',
    code: '',
    domain: '',
    settings: {},
  });

  useEffect(() => {
    loadCompanies();
  }, [search]);

  const loadCompanies = async () => {
    try {
      const res = await companiesApi.getCompanies({ limit: 100, search: search || undefined });
      setCompanies(res.data);
    } catch (e) {
      console.error('Failed to load companies:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await companiesApi.updateCompanyById(editingCompany.id, formData);
      } else {
        await companiesApi.createCompany(formData);
      }
      setShowModal(false);
      setEditingCompany(null);
      setFormData({ name: '', code: '', domain: '', settings: {} });
      loadCompanies();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Operation failed');
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
      loadCompanies();
    } catch (e: any) {
      alert(e.response?.data?.message || t('deleteFailed'));
    }
  };

  return (
    <div>
      {/* 头部 */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          {t('companyManagement')}
        </h3>
        <button
          onClick={() => {
            setEditingCompany(null);
            setFormData({ name: '', code: '', domain: '', settings: {} });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-brand-text rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          {t('addCompany')}
        </button>
      </div>

      {/* 搜索 */}
      <div className="mb-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={t('searchCompanies')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* 表格 */}
      {loading ? (
        <div className="p-4"><TableSkeleton rows={5} columns={5} /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('companyName')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('companyCode')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('domain')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('user')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('departments')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {companies.map(company => (
                <tr key={company.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{company.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">{company.code || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{company.domain || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{company._count?.users || 0}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{company._count?.departments || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(company)} className="p-1 text-slate-400 hover:text-primary">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(company)} className="p-1 text-slate-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 添加/编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">
                {editingCompany ? t('editCompany') : t('addCompany')}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('companyName')} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('companyCode')} *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  placeholder="DG001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">{t('companyCodeHint')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('domain')}</label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="dongguan.makrite.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-slate-500 mt-1">{t('domainHintOptional')}</p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  {t('cancel')}
                </button>
                <button type="submit" className="px-4 py-2 bg-brand-primary text-brand-text rounded-lg hover:opacity-90 transition-opacity">
                  {editingCompany ? t('update') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyList;

