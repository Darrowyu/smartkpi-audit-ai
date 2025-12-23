import React, { useState, useEffect } from 'react';
import { usersApi, User, CreateUserData, UpdateUserData } from '../api/users.api';
import { getDepartments, Department } from '../api/departments.api';
import { companiesApi, Company } from '../api/companies.api';
import { useAuth } from '../context/AuthContext';
import { translations } from '../utils/i18n';
import { Language } from '../types';
import { Users, Plus, Edit, Trash2, Search, Shield, UserCheck, X } from 'lucide-react';

interface Props {
  language: Language;
  t: typeof translations['en'];
}

const UserManagement: React.FC<Props> = ({ language }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [formData, setFormData] = useState<CreateUserData & { departmentId?: string; companyId?: string }>({
    username: '', email: '', password: '', firstName: '', lastName: '', role: 'USER', language: 'zh', departmentId: undefined, companyId: undefined
  });

  const isGroupAdmin = currentUser?.role === 'GROUP_ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (isGroupAdmin) {
      loadUsers();
      loadDepartments();
      loadCompanies();
    }
  }, [isGroupAdmin, search, roleFilter]);

  const loadUsers = async () => {
    try {
      const res = await usersApi.getUsers(1, 50, search || undefined, roleFilter || undefined);
      setUsers(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadDepartments = async () => {
    try {
      const res = await getDepartments({ limit: 100 });
      setDepartments(res.data);
    } catch (e) { console.error(e); }
  };

  const loadCompanies = async () => {
    try {
      if (isGroupAdmin) {
        const res = await companiesApi.getCompanies({ limit: 100 });
        setCompanies(res.data);
      }
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const { username, password, ...rest } = formData;
        const updateData: UpdateUserData = { email: rest.email, firstName: rest.firstName, lastName: rest.lastName, role: rest.role, language: rest.language };
        await usersApi.updateUser(editingUser.id, updateData);
      } else {
        await usersApi.createUser(formData);
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ username: '', email: '', password: '', firstName: '', lastName: '', role: 'USER', language: 'zh' });
      loadUsers();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Operation failed');
    }
  };


  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      password: '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role as any,
      language: user.language,
      departmentId: (user as any).departmentId || undefined
    });
    setShowModal(true);
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`${language === 'zh' ? '确定删除用户' : 'Delete user'} ${user.username}?`)) return;
    try {
      await usersApi.deleteUser(user.id);
      loadUsers();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Delete failed');
    }
  };

  const roleLabels: Record<string, string> = {
    USER: language === 'zh' ? '普通用户' : 'User',
    MANAGER: language === 'zh' ? '经理' : 'Manager',
    GROUP_ADMIN: language === 'zh' ? '集团管理员' : 'Group Admin',
    SUPER_ADMIN: language === 'zh' ? '超级管理员' : 'Super Admin',
  };

  const roleColors: Record<string, string> = {
    USER: 'bg-gray-100 text-gray-700',
    MANAGER: 'bg-blue-100 text-blue-700',
    GROUP_ADMIN: 'bg-green-100 text-green-700',
    SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  };

  if (!isGroupAdmin) {
    return (
      <div className="text-center py-20">
        <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl text-slate-600">{language === 'zh' ? '权限不足' : 'Access Denied'}</h2>
        <p className="text-slate-500">{language === 'zh' ? '只有管理员可以管理用户' : 'Only admins can manage users'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          {language === 'zh' ? '用户管理' : 'User Management'}
        </h2>
        <button onClick={() => { setEditingUser(null); setFormData({ username: '', email: '', password: '', firstName: '', lastName: '', role: 'USER', language: 'zh' }); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />{language === 'zh' ? '添加用户' : 'Add User'}
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input type="text" placeholder={language === 'zh' ? '搜索用户...' : 'Search users...'} value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500">
            <option value="">{language === 'zh' ? '所有角色' : 'All Roles'}</option>
            <option value="USER">{roleLabels.USER}</option>
            <option value="MANAGER">{roleLabels.MANAGER}</option>
            <option value="ADMIN">{roleLabels.ADMIN}</option>
          </select>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">{language === 'zh' ? '加载中...' : 'Loading...'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{language === 'zh' ? '用户' : 'User'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{language === 'zh' ? '邮箱' : 'Email'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{language === 'zh' ? '部门' : 'Department'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{language === 'zh' ? '角色' : 'Role'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{language === 'zh' ? '状态' : 'Status'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{language === 'zh' ? '最后登录' : 'Last Login'}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">{language === 'zh' ? '操作' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">{user.username}</div>
                        <div className="text-sm text-slate-500">{user.firstName} {user.lastName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{user.email || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {(user as any).department?.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {user.isActive ? <UserCheck className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />}
                        <span className={`text-sm ${user.isActive ? 'text-green-700' : 'text-red-700'}`}>
                          {user.isActive ? (language === 'zh' ? '活跃' : 'Active') : (language === 'zh' ? '禁用' : 'Inactive')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : (language === 'zh' ? '从未登录' : 'Never')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(user)} className="p-1 text-slate-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                        {user.id !== currentUser?.id && (
                          <button onClick={() => handleDelete(user)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* 添加/编辑用户模态框 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">
                {editingUser ? (language === 'zh' ? '编辑用户' : 'Edit User') : (language === 'zh' ? '添加用户' : 'Add User')}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'zh' ? '用户名' : 'Username'} *</label>
                <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required disabled={!!editingUser} minLength={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-slate-100" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'zh' ? '名' : 'First Name'}</label>
                  <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'zh' ? '姓' : 'Last Name'}</label>
                  <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'zh' ? '邮箱' : 'Email'}</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'zh' ? '密码' : 'Password'} *</label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required minLength={6}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
              )}
              {isGroupAdmin && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'zh' ? '子公司' : 'Company'} *</label>
                  <select
                    value={formData.companyId || ''}
                    onChange={(e) => setFormData({...formData, companyId: e.target.value || undefined})}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">{language === 'zh' ? '请选择子公司' : 'Select Company'}</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'zh' ? '部门' : 'Department'}</label>
                <select
                  value={formData.departmentId || ''}
                  onChange={(e) => setFormData({...formData, departmentId: e.target.value || undefined})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">{language === 'zh' ? '无部门' : 'No Department'}</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'zh' ? '角色' : 'Role'}</label>
                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500">
                  <option value="USER">{roleLabels.USER}</option>
                  <option value="MANAGER">{roleLabels.MANAGER}</option>
                  <option value="GROUP_ADMIN">{roleLabels.GROUP_ADMIN}</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">
                  {language === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingUser ? (language === 'zh' ? '更新' : 'Update') : (language === 'zh' ? '创建' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
