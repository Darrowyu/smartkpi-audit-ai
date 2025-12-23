import React, { useState, useEffect } from 'react';
import { companiesApi, Company, CompanyStats } from '../api/companies.api';
import { useAuth } from '../context/AuthContext';
import { translations } from '../utils/i18n';
import { Language } from '../types';
import { Building2, Users, Briefcase, UserCircle, FileText, BarChart3, Edit, X, Check, Calendar } from 'lucide-react';

interface Props {
  language: Language;
  t: typeof translations['en'];
}

const CompanySettings: React.FC<Props> = ({ language }) => {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', code: '', domain: '' });
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'GROUP_ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [companyData, statsData] = await Promise.all([
        companiesApi.getCompany(),
        companiesApi.getStats(),
      ]);
      setCompany(companyData);
      setStats(statsData);
      setEditForm({ name: companyData.name, code: companyData.code || '', domain: companyData.domain || '' });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await companiesApi.updateCompany({
        name: editForm.name,
        code: editForm.code || undefined,
        domain: editForm.domain || undefined,
      });
      setCompany(updated);
      setShowEditModal(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (language === 'zh' ? '更新失败' : 'Update failed');
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-500">{language === 'zh' ? '加载中...' : 'Loading...'}</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">{language === 'zh' ? '无法加载公司信息' : 'Failed to load company info'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          {language === 'zh' ? '公司管理' : 'Company Management'}
        </h2>
        {isAdmin && (
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Edit className="w-4 h-4" />
            {language === 'zh' ? '编辑' : 'Edit'}
          </button>
        )}
      </div>

      {/* 公司基本信息 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          {language === 'zh' ? '基本信息' : 'Basic Information'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              {language === 'zh' ? '公司名称' : 'Company Name'}
            </label>
            <p className="text-slate-900 font-medium">{company.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              {language === 'zh' ? '公司代码' : 'Company Code'}
            </label>
            <p className="text-slate-900 font-medium">{(company as { code?: string }).code || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              {language === 'zh' ? '域名标识' : 'Domain'}
            </label>
            <p className="text-slate-900 font-medium">{company.domain || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              {language === 'zh' ? '创建时间' : 'Created At'}
            </label>
            <p className="text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              {new Date(company.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              {language === 'zh' ? '状态' : 'Status'}
            </label>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${company.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {company.isActive ? (language === 'zh' ? '活跃' : 'Active') : (language === 'zh' ? '禁用' : 'Inactive')}
            </span>
          </div>
        </div>
      </div>

      {/* 统计数据 */}
      {stats && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {language === 'zh' ? '数据统计' : 'Statistics'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} label={language === 'zh' ? '用户' : 'Users'} value={stats.users} />
            <StatCard icon={<Briefcase className="w-5 h-5 text-green-600" />} label={language === 'zh' ? '部门' : 'Departments'} value={stats.departments} />
            <StatCard icon={<UserCircle className="w-5 h-5 text-purple-600" />} label={language === 'zh' ? '员工' : 'Employees'} value={stats.employees} />
            <StatCard icon={<FileText className="w-5 h-5 text-orange-600" />} label={language === 'zh' ? '文件' : 'Files'} value={stats.files} />
            <StatCard icon={<BarChart3 className="w-5 h-5 text-blue-600" />} label={language === 'zh' ? '分析' : 'Analyses'} value={stats.analyses} />
          </div>
        </div>
      )}

      {/* 编辑模态框 */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                {language === 'zh' ? '编辑公司信息' : 'Edit Company'}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {language === 'zh' ? '公司名称' : 'Company Name'} *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {language === 'zh' ? '公司代码' : 'Company Code'}
                </label>
                <input
                  type="text"
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                  placeholder="DG001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'zh' ? '公司内部编码，如 DG001、SH002' : 'Internal company code, e.g., DG001'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {language === 'zh' ? '域名标识' : 'Domain'}
                </label>
                <input
                  type="text"
                  value={editForm.domain}
                  onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                  placeholder="dongguan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'zh' ? '用于多租户域名识别，如 dongguan.makrite.com' : 'For multi-tenant domain, e.g., dongguan.makrite.com'}
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  {language === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? '...' : (
                    <>
                      <Check className="w-4 h-4" />
                      {language === 'zh' ? '保存' : 'Save'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => (
  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-xs font-medium text-slate-600">{label}</span>
    </div>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

export default CompanySettings;

