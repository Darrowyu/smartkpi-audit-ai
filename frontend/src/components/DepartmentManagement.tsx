import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, Department } from '../api/departments.api';
import { Language } from '../types';

interface Props {
  language: Language;
}

const DepartmentManagement: React.FC<Props> = ({ language }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const t = {
    en: {
      title: 'Department Management',
      search: 'Search departments...',
      addDept: 'Add Department',
      name: 'Department Name',
      code: 'Code',
      description: 'Description',
      employees: 'Employees',
      users: 'Users',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      createTitle: 'Create Department',
      editTitle: 'Edit Department',
      confirmDelete: 'Are you sure you want to delete this department?',
      noDepts: 'No departments found',
    },
    zh: {
      title: '部门管理',
      search: '搜索部门...',
      addDept: '添加部门',
      name: '部门名称',
      code: '部门代码',
      description: '描述',
      employees: '员工数',
      users: '用户数',
      actions: '操作',
      edit: '编辑',
      delete: '删除',
      save: '保存',
      cancel: '取消',
      createTitle: '创建部门',
      editTitle: '编辑部门',
      confirmDelete: '确定要删除此部门吗？',
      noDepts: '未找到部门',
    },
  }[language];

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await getDepartments({ limit: 100 });
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to load departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, formData);
      } else {
        await createDepartment(formData);
      }
      setShowModal(false);
      setFormData({ name: '', code: '', description: '' });
      setEditingDept(null);
      loadDepartments();
    } catch (error) {
      console.error('Failed to save department:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({ name: dept.name, code: dept.code || '', description: dept.description || '' });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await deleteDepartment(id);
      loadDepartments();
    } catch (error) {
      console.error('Failed to delete department:', error);
    }
  };

  const filteredDepts = departments.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.code && d.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingDept(null); setFormData({ name: '', code: '', description: '' }); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t.addDept}
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredDepts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">{t.noDepts}</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.name}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.code}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.description}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDepts.map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{dept.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{dept.code || '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{dept.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button onClick={() => handleEdit(dept)} className="text-blue-600 hover:text-blue-800 mr-4">
                      <Edit2 className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => handleDelete(dept.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editingDept ? t.editTitle : t.createTitle}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.name}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.code}</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.description}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? '...' : t.save}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;

