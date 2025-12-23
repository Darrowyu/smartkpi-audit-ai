import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { kpiLibraryApi } from '@/api/kpi-library.api';
import { KPIDefinition, FormulaType, AssessmentFrequency } from '@/types';

// Form values type
interface KPIFormValues {
    code: string;
    name: string;
    description?: string;
    formulaType: FormulaType;
    customFormula?: string;
    frequency: AssessmentFrequency;
    defaultWeight: number;
    scoreCap: number;
    scoreFloor: number;
    unit?: string;
}

// Zod Schema for Validation
const kpiSchema = z.object({
    code: z.string().min(1, '请输入指标编码'),
    name: z.string().min(1, '请输入指标名称'),
    description: z.string().optional(),
    formulaType: z.enum([
        FormulaType.POSITIVE,
        FormulaType.NEGATIVE,
        FormulaType.BINARY,
        FormulaType.STEPPED,
        FormulaType.CUSTOM,
    ]),
    customFormula: z.string().optional(),
    frequency: z.enum([
        AssessmentFrequency.MONTHLY,
        AssessmentFrequency.QUARTERLY,
        AssessmentFrequency.YEARLY,
    ]),
    defaultWeight: z.number().min(0).max(100),
    scoreCap: z.number().min(0),
    scoreFloor: z.number().min(0),
    unit: z.string().optional(),
});

export const KPILibraryView: React.FC = () => {
    const [kpis, setKpis] = useState<KPIDefinition[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingKPI, setEditingKPI] = useState<KPIDefinition | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { toast } = useToast();

    const form = useForm<KPIFormValues>({
        resolver: zodResolver(kpiSchema),
        defaultValues: {
            formulaType: FormulaType.POSITIVE,
            frequency: AssessmentFrequency.MONTHLY,
            defaultWeight: 10,
            scoreCap: 120,
            scoreFloor: 0,
        },
    });

    const fetchKPIs = async () => {
        setLoading(true);
        try {
            const res = await kpiLibraryApi.findAll({ search: searchTerm });
            setKpis(res.data);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: '获取指标失败',
                description: '无法加载指标库数据',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKPIs();
    }, [searchTerm]);

    const onSubmit = async (data: KPIFormValues) => {
        try {
            if (editingKPI) {
                await kpiLibraryApi.update(editingKPI.id, data);
                toast({ title: '更新成功', description: '指标已更新' });
            } else {
                await kpiLibraryApi.create(data);
                toast({ title: '创建成功', description: '新指标已添加到库' });
            }
            setIsDialogOpen(false);
            setEditingKPI(null);
            form.reset();
            fetchKPIs();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: editingKPI ? '更新失败' : '创建失败',
                description: error.response?.data?.message || '操作失败，请重试',
            });
        }
    };

    const handleEdit = (kpi: KPIDefinition) => {
        setEditingKPI(kpi);
        form.reset({
            code: kpi.code,
            name: kpi.name,
            description: kpi.description,
            formulaType: kpi.formulaType,
            customFormula: kpi.customFormula,
            frequency: kpi.frequency,
            defaultWeight: kpi.defaultWeight,
            scoreCap: kpi.scoreCap,
            scoreFloor: kpi.scoreFloor,
            unit: kpi.unit,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这个指标吗？')) return;
        try {
            await kpiLibraryApi.remove(id);
            toast({ title: '删除成功' });
            fetchKPIs();
        } catch (error) {
            toast({ variant: 'destructive', title: '删除失败' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">KPI 指标库</h2>
                    <p className="text-muted-foreground">管理企业核心绩效指标定义与计算规则</p>
                </div>
                <Button onClick={() => { setEditingKPI(null); form.reset(); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> 新建指标
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索指标名称或编码..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>编码</TableHead>
                                    <TableHead>名称</TableHead>
                                    <TableHead>计分类型</TableHead>
                                    <TableHead>频率</TableHead>
                                    <TableHead>默认权重</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10">加载中...</TableCell>
                                    </TableRow>
                                ) : kpis.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10">暂无数据</TableCell>
                                    </TableRow>
                                ) : (
                                    kpis.map((kpi) => (
                                        <TableRow key={kpi.id}>
                                            <TableCell className="font-medium">{kpi.code}</TableCell>
                                            <TableCell>{kpi.name}</TableCell>
                                            <TableCell>{kpi.formulaType}</TableCell>
                                            <TableCell>{kpi.frequency}</TableCell>
                                            <TableCell>{kpi.defaultWeight}%</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(kpi)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(kpi.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingKPI ? '编辑指标' : '新建指标'}</DialogTitle>
                        <DialogDescription>配置指标的基本信息和计分规则。</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>指标编码</Label>
                                <Input {...form.register('code')} placeholder="如：SALES_RATE" disabled={!!editingKPI} />
                                {form.formState.errors.code && <p className="text-red-500 text-xs">{form.formState.errors.code.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>指标名称</Label>
                                <Input {...form.register('name')} placeholder="如：销售达成率" />
                                {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>指标说明</Label>
                            <Input {...form.register('description')} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>计分逻辑</Label>
                                <Select
                                    onValueChange={(val) => form.setValue('formulaType', val as FormulaType)}
                                    defaultValue={form.watch('formulaType')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择类型" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={FormulaType.POSITIVE}>正向指标 (越大越好)</SelectItem>
                                        <SelectItem value={FormulaType.NEGATIVE}>反向指标 (越小越好)</SelectItem>
                                        <SelectItem value={FormulaType.BINARY}>二元指标 (0/1)</SelectItem>
                                        <SelectItem value={FormulaType.CUSTOM}>自定义公式</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>考核频率</Label>
                                <Select
                                    onValueChange={(val) => form.setValue('frequency', val as AssessmentFrequency)}
                                    defaultValue={form.watch('frequency')}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={AssessmentFrequency.MONTHLY}>月度</SelectItem>
                                        <SelectItem value={AssessmentFrequency.QUARTERLY}>季度</SelectItem>
                                        <SelectItem value={AssessmentFrequency.YEARLY}>年度</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>默认权重 (%)</Label>
                                <Input type="number" {...form.register('defaultWeight')} />
                            </div>
                            <div className="space-y-2">
                                <Label>得分上限</Label>
                                <Input type="number" {...form.register('scoreCap')} />
                            </div>
                            <div className="space-y-2">
                                <Label>得分下限</Label>
                                <Input type="number" {...form.register('scoreFloor')} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                            <Button type="submit">保存</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
