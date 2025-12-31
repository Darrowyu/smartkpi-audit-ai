import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Plus, Search, Edit2, Trash2, RefreshCw, Users } from 'lucide-react';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, Department } from '@/api/departments.api';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/use-toast';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Language } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  language: Language;
  embedded?: boolean;
}

const DepartmentManagement: React.FC<Props> = ({ language, embedded = false }) => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getDepartments({ limit: 100 });
      setDepartments(response.data);
    } catch {
      toast({ variant: 'destructive', title: '加载部门失败' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const handleRefresh = () => {
    loadDepartments();
    toast({ title: '已刷新' });
  };

  const openCreateModal = () => {
    setEditingDept(null);
    setFormData({ name: '', code: '', description: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ variant: 'destructive', title: '部门名称不能为空' });
      return;
    }
    setSubmitting(true);
    try {
      const data = {
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        description: formData.description.trim() || undefined,
      };
      if (editingDept) {
        await updateDepartment(editingDept.id, data);
        toast({ title: '部门已更新' });
      } else {
        await createDepartment(data);
        toast({ title: '部门已创建' });
      }
      setShowModal(false);
      setFormData({ name: '', code: '', description: '' });
      setEditingDept(null);
      loadDepartments();
    } catch {
      toast({ variant: 'destructive', title: '保存部门失败' });
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
    const confirmed = await confirm({
      title: t('common.confirm'),
      description: t('confirmDeleteDepartment'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    try {
      await deleteDepartment(id);
      toast({ title: '部门已删除' });
      loadDepartments();
    } catch {
      toast({ variant: 'destructive', title: '删除部门失败' });
    }
  };

  const filteredDepts = departments.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.code && d.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const containerClass = embedded ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8';

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {!embedded && (
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className={cn('font-bold text-slate-900', embedded ? 'text-lg' : 'text-2xl')}>
                {t('departmentManagement')}
              </h1>
              <Badge variant="secondary" className="bg-slate-100">
                {departments.length}
              </Badge>
            </div>
            {!embedded && <p className="text-sm text-slate-500">管理公司组织架构</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!embedded && (
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </Button>
          )}
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            {t('addDepartment')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            type="text"
            placeholder={t('searchDepartments')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : filteredDepts.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="暂无部门"
          description={searchTerm ? '没有找到匹配的部门' : '点击上方按钮添加第一个部门'}
          action={!searchTerm ? <Button onClick={openCreateModal}><Plus className="w-4 h-4 mr-2" />添加部门</Button> : undefined}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase w-12">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('departmentName')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('code')}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">员工数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('description')}</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase w-24">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDepts.map((dept, index) => (
                <tr key={dept.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-400">{index + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900">{dept.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    {dept.code ? (
                      <code className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">{dept.code}</code>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="secondary" className="bg-violet-50 text-violet-700 gap-1">
                      <Users className="w-3 h-3" />
                      {dept._count?.employees ?? 0}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">
                    {dept.description || <span className="text-slate-400">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(dept)} className="h-8 w-8">
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(dept.id)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDept ? t('editDepartment') : t('createDepartment')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('departmentName')} <span className="text-red-500">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：研发部"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('code')}</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="如：RD001"
                className="font-mono"
              />
              <p className="text-xs text-slate-500">用于系统内部识别</p>
            </div>
            <div className="space-y-2">
              <Label>{t('description')}</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="部门职能描述..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-ring/20 focus:border-primary resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? '保存中...' : t('save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartmentManagement;
