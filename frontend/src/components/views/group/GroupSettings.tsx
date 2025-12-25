import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { groupsApi, Group } from '@/api/groups.api';
import { useAuth } from '@/context/AuthContext';
import { Language } from '@/types';
import { Building2, Edit, X, Check, Calendar, Globe } from 'lucide-react';

interface Props {
  language: Language;
  onUpdate?: () => void;
}

const GroupSettings: React.FC<Props> = ({ language, onUpdate }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '' });
  const [saving, setSaving] = useState(false);

  const groupId = user?.groupId || (user as { company?: { groupId?: string } })?.company?.groupId;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => { loadGroup(); }, [groupId]);

  const loadGroup = async () => {
    if (!groupId) { setLoading(false); return; }
    try {
      const data = await groupsApi.getGroup(groupId);
      setGroup(data);
      setEditForm({ name: data.name });
    } catch (e) {
      console.error('Failed to load group:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    setSaving(true);
    try {
      const updated = await groupsApi.updateGroup(groupId, { name: editForm.name });
      setGroup(updated);
      setShowEditModal(false);
      onUpdate?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('updateFailed');
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">{t('loading')}</div>;
  }

  if (!group) {
    return <div className="text-center py-8 text-slate-500">{t('failedToLoadGroup')}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          {t('groupSettings')}
        </h3>
        {isSuperAdmin && (
          <button onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Edit className="w-4 h-4" />
            {t('edit')}
          </button>
        )}
      </div>

      {/* 集团基本信息 */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              {t('groupName')}
            </label>
            <p className="text-slate-900 font-medium text-lg">{group.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              {t('groupId')}
            </label>
            <p className="text-slate-600 font-mono text-sm">{group.id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              {t('createdAt')}
            </label>
            <p className="text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              {new Date(group.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              {t('status')}
            </label>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${group.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {group.isActive ? t('active') : t('inactive')}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              {t('companies')}
            </label>
            <p className="text-slate-900 font-medium">{group._count?.companies || 0}</p>
          </div>
        </div>
      </div>

      {/* 提示信息 */}
      {!isSuperAdmin && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            {t('onlySuperAdminCanModifyGroup')}
          </p>
        </div>
      )}

      {/* 编辑模态框 */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                {t('editGroup')}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('groupName')} *
                </label>
                <input type="text" value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {saving ? '...' : <><Check className="w-4 h-4" />{t('save')}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupSettings;
