import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { companiesApi, Company, CompanyStats } from '@/api/companies.api';
import { useAuth } from '@/context/AuthContext';
import { Language } from '@/types';
import { Building2, Users, Briefcase, UserCircle, FileText, BarChart3, Edit, Check, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  language: Language;
}

const CompanySettings: React.FC<Props> = ({ language }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
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
      const msg = e instanceof Error ? e.message : t('updateFailed');
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('loading')}</div>;
  }

  if (!company) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('failedToLoadCompany')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('companyManagement')}</h2>
          <p className="text-muted-foreground">{t('sidebar.companySettings')}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowEditModal(true)}>
            <Edit className="w-4 h-4 mr-2" />
            {t('edit')}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('companyName')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company.name}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('companyCode')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(company as { code?: string }).code || '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('createdAt')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Date(company.createdAt).toLocaleDateString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('status')}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${company.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {company.isActive ? t('active') : t('inactive')}
            </span>
          </CardContent>
        </Card>
      </div>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>{t('statistics')}</CardTitle>
            <CardDescription>{t('sidebar.companySettings')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('user')}</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.users}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('departments')}</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.departments}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('employees')}</CardTitle>
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.employees}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('files')}</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.files}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('analyses')}</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.analyses}</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editCompany')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('companyName')} *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('companyCode')}</Label>
              <Input
                value={editForm.code}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                placeholder="DG001"
              />
              <p className="text-xs text-muted-foreground">{t('companyCodeHint')}</p>
            </div>
            <div className="space-y-2">
              <Label>{t('domain')}</Label>
              <Input
                value={editForm.domain}
                onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                placeholder="dongguan"
              />
              <p className="text-xs text-muted-foreground">{t('domainHint')}</p>
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

export default CompanySettings;

