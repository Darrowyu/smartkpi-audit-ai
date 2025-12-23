import React, { useState, useEffect } from 'react';
import { companiesApi, Company, CreateCompanyData } from '../api/companies.api';
import { Language } from '../types';
import { Building2, Plus, Edit, Trash2, Search } from 'lucide-react';

interface Props {
  language: Language;
}

const CompanyList: React.FC<Props> = ({ language }) => {
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
    if (!confirm(language === 'zh' ? `确定要删除子公司"${company.name}"吗？` : `Delete company "${company.name}"?`)) return;
    try {
      await companiesApi.deleteCompany(company.id);
      loadCompanies();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      {/* 头部 */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          {language === 'zh' ? '子公司管理' : 'Company Management'}
        </h3>
        <button
          onClick={() => {
            setEditingCompany(null);
            setFormData({ name: '', code: '', domain: '', settings: {} });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          {language === 'zh' ? '添加子公司' : 'Add Company'}
        </button>
      </div>

      {/* 搜索 */}
      <div className="mb-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'zh' ? '搜索子公司...' : 'Search companies...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 表格 */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">{language === 'zh' ? '加载中...' : 'Loading...'}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{language === 'zh' ? '公司名称' : 'Name'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{language === 'zh' ? '公司代码' : 'Code'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{language === 'zh' ? '域名' : 'Domain'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{language === 'zh' ? '用户数' : 'Users'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{language === 'zh' ? '部门数' : 'Departments'}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">{language === 'zh' ? '操作' : 'Actions'}</th>
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
                      <button onClick={() => handleEdit(company)} className="p-1 text-slate-400 hover:text-blue-600">
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
                {editingCompany ? (language === 'zh' ? '编辑子公司' : 'Edit Company') : (language === 'zh' ? '添加子公司' : 'Add Company')}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'zh' ? '公司名称' : 'Company Name'} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'zh' ? '公司代码' : 'Company Code'} *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  placeholder="DG001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">{language === 'zh' ? '公司唯一编码，如 DG001、SH002' : 'Unique code, e.g., DG001'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'zh' ? '域名' : 'Domain'}</label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="dongguan.makrite.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">{language === 'zh' ? '可选，用于多租户域名识别' : 'Optional, for multi-tenant domain'}</p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  {language === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingCompany ? (language === 'zh' ? '更新' : 'Update') : (language === 'zh' ? '创建' : 'Create')}
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

