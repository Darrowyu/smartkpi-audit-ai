import React, { useEffect, useState, useCallback, memo } from 'react';
import { Database, Plus, RefreshCw, Settings, Trash2, CheckCircle, XCircle, Clock, Plug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { datasourceApi, DataSourceConfig, DataSyncLog } from '@/api/datasource.api';
import { usePermission } from '@/hooks/usePermission';
import { cn } from '@/lib/utils';
import { TableRowSkeleton } from '@/components/ui/skeleton';

const TYPE_OPTIONS = [
  { value: 'api', label: 'REST API' },
  { value: 'database', label: '数据库' },
  { value: 'file', label: '文件导入' },
  { value: 'webhook', label: 'Webhook' },
];

const SYNC_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  success: { label: '成功', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="w-3 h-3" /> },
  failed: { label: '失败', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
  running: { label: '运行中', color: 'bg-primary/10 text-primary', icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
};

export const DataSourceView: React.FC = memo(() => {
  const { toast } = useToast();
  const canView = usePermission('datasource:view');
  const canCreate = usePermission('datasource:create');
  const canEdit = usePermission('datasource:edit');
  const canDelete = usePermission('datasource:delete');
  const [dataSources, setDataSources] = useState<DataSourceConfig[]>([]);
  const [syncLogs, setSyncLogs] = useState<DataSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('api');
  const [syncFrequency, setSyncFrequency] = useState('daily');
  const [connectionUrl, setConnectionUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const loadDataSources = useCallback(async () => {
    setLoading(true);
    try {
      const [sources, logs] = await Promise.all([
        datasourceApi.getDataSources(),
        datasourceApi.getSyncLogs(),
      ]);
      setDataSources(sources || []);
      setSyncLogs(logs || []);
    } catch { toast({ variant: 'destructive', title: '加载数据源失败' }); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { loadDataSources(); }, [loadDataSources]);

  const handleCreate = async () => {
    if (!canCreate) {
      toast({ variant: 'destructive', title: '无创建权限' });
      return;
    }
    if (!name.trim() || !connectionUrl.trim()) return;
    setProcessing(true);
    try {
      await datasourceApi.createDataSource({
        name,
        type,
        connectionConfig: { url: connectionUrl },
        fieldMapping: {},
        syncFrequency,
      });
      toast({ title: '数据源已创建' });
      setCreateDialogOpen(false);
      resetForm();
      loadDataSources();
    } catch { toast({ variant: 'destructive', title: '创建失败' }); }
    finally { setProcessing(false); }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const result = await datasourceApi.testConnection(id);
      toast({ title: result.success ? '连接成功' : '连接失败', description: result.message });
    } catch { toast({ variant: 'destructive', title: '测试失败' }); }
    finally { setTestingId(null); }
  };

  const handleSync = async (id: string) => {
    if (!canEdit) {
      toast({ variant: 'destructive', title: '无编辑权限' });
      return;
    }
    setSyncingId(id);
    try {
      await datasourceApi.triggerSync(id);
      toast({ title: '同步任务已启动' });
      loadDataSources();
    } catch { toast({ variant: 'destructive', title: '同步失败' }); }
    finally { setSyncingId(null); }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      toast({ variant: 'destructive', title: '无删除权限' });
      return;
    }
    if (!confirm('确定要删除此数据源吗？')) return;
    try {
      await datasourceApi.deleteDataSource(id);
      toast({ title: '数据源已删除' });
      loadDataSources();
    } catch { toast({ variant: 'destructive', title: '删除失败' }); }
  };

  const handleToggleActive = async (ds: DataSourceConfig) => {
    if (!canEdit) {
      toast({ variant: 'destructive', title: '无编辑权限' });
      return;
    }
    try {
      await datasourceApi.updateDataSource(ds.id, { isActive: !ds.isActive });
      loadDataSources();
    } catch { toast({ variant: 'destructive', title: '更新失败' }); }
  };

  const resetForm = () => {
    setName('');
    setType('api');
    setSyncFrequency('daily');
    setConnectionUrl('');
  };

  const activeCount = dataSources.filter(ds => ds.isActive).length;

  if (!canView) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-slate-600">无权限访问数据源配置</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">数据源配置</h1>
          <p className="text-slate-500">管理外部数据源接入与同步</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} disabled={!canCreate}><Plus className="w-4 h-4 mr-2" />添加数据源</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-primary">{dataSources.length}</div><p className="text-sm text-slate-500">数据源总数</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-emerald-600">{activeCount}</div><p className="text-sm text-slate-500">已启用</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-amber-600">{syncLogs.filter(l => l.status === 'running').length}</div><p className="text-sm text-slate-500">同步中</p></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-red-600">{syncLogs.filter(l => l.status === 'failed').length}</div><p className="text-sm text-slate-500">失败任务</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Database className="w-5 h-5" />数据源列表</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>同步频率</TableHead>
                <TableHead>最后同步</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>启用</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <TableRowSkeleton key={i} columns={7} />)
              ) : dataSources.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-500">暂无数据源，点击"添加数据源"开始配置</TableCell></TableRow>
              ) : (
                dataSources.map(ds => {
                  const statusInfo = ds.lastSyncStatus ? SYNC_STATUS[ds.lastSyncStatus] : null;
                  return (
                    <TableRow key={ds.id}>
                      <TableCell className="font-medium">{ds.name}</TableCell>
                      <TableCell><Badge variant="outline">{TYPE_OPTIONS.find(t => t.value === ds.type)?.label || ds.type}</Badge></TableCell>
                      <TableCell>{ds.syncFrequency === 'daily' ? '每日' : ds.syncFrequency === 'hourly' ? '每小时' : ds.syncFrequency}</TableCell>
                      <TableCell>{ds.lastSyncAt ? new Date(ds.lastSyncAt).toLocaleString() : '-'}</TableCell>
                      <TableCell>
                        {statusInfo ? <Badge className={cn('gap-1', statusInfo.color)}>{statusInfo.icon}{statusInfo.label}</Badge> : <span className="text-slate-400">-</span>}
                      </TableCell>
                      <TableCell><Switch checked={ds.isActive} onCheckedChange={() => handleToggleActive(ds)} disabled={!canEdit} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleTestConnection(ds.id)} disabled={testingId === ds.id}><Plug className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleSync(ds.id)} disabled={syncingId === ds.id || !canEdit}><RefreshCw className={cn('w-4 h-4', syncingId === ds.id && 'animate-spin')} /></Button>
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(ds.id)} disabled={!canDelete}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" />同步日志</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>开始时间</TableHead>
                <TableHead>完成时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>处理记录数</TableHead>
                <TableHead>错误信息</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syncLogs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">暂无同步日志</TableCell></TableRow>
              ) : (
                syncLogs.slice(0, 10).map(log => {
                  const statusInfo = SYNC_STATUS[log.status] || SYNC_STATUS.running;
                  return (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.startedAt).toLocaleString()}</TableCell>
                      <TableCell>{log.completedAt ? new Date(log.completedAt).toLocaleString() : '-'}</TableCell>
                      <TableCell><Badge className={cn('gap-1', statusInfo.color)}>{statusInfo.icon}{statusInfo.label}</Badge></TableCell>
                      <TableCell>{log.recordsProcessed ?? '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-red-600" title={log.errorMessage || ''}>{log.errorMessage || '-'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>添加数据源</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">名称 *</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="数据源名称" />
            </div>
            <div>
              <label className="text-sm font-medium">类型</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">连接地址 *</label>
              <Input value={connectionUrl} onChange={e => setConnectionUrl(e.target.value)} placeholder="API URL 或数据库连接字符串" />
            </div>
            <div>
              <label className="text-sm font-medium">同步频率</label>
              <Select value={syncFrequency} onValueChange={setSyncFrequency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">每小时</SelectItem>
                  <SelectItem value="daily">每日</SelectItem>
                  <SelectItem value="weekly">每周</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetForm(); }}>取消</Button>
            <Button onClick={handleCreate} disabled={processing || !name.trim() || !connectionUrl.trim()}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

DataSourceView.displayName = 'DataSourceView';
