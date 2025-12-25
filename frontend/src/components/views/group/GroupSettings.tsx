import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { groupsApi, Group } from '@/api/groups.api';
import { useAuth } from '@/context/AuthContext';
import { Language } from '@/types';
import { Edit, X, Check, Calendar, Globe, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('loading')}</div>;
  }

  if (!group) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('failedToLoadGroup')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('groupSettings')}</h2>
          <p className="text-muted-foreground">{t('sidebar.groupSettings')}</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setShowEditModal(true)}>
            <Edit className="w-4 h-4 mr-2" />
            {t('edit')}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('groupName')}</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{group.name}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('companies')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{group._count?.companies || 0}</div>
            <p className="text-xs text-muted-foreground">{t('active')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('createdAt')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Date(group.createdAt).toLocaleDateString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('status')}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${group.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {group.isActive ? t('active') : t('inactive')}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-muted-foreground">{t('groupId')}</Label>
              <p className="font-mono text-sm mt-1">{group.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!isSuperAdmin && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800">{t('onlySuperAdminCanModifyGroup')}</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editGroup')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('groupName')} *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? '...' : <><Check className="w-4 h-4 mr-2" />{t('save')}</>}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupSettings;
