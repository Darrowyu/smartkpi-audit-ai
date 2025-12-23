import React, { useEffect, useState } from 'react';
import { Plus, Lock, Calendar } from 'lucide-react';
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
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { assessmentApi } from '@/api/assessment.api';
import { AssessmentPeriod, PeriodStatus } from '@/types';

const periodSchema = z.object({
    name: z.string().min(1, '请输入周期名称'),
    startDate: z.string().min(1, '请选择开始日期'),
    endDate: z.string().min(1, '请选择结束日期'),
});

type PeriodFormValues = z.infer<typeof periodSchema>;

export const AssessmentPeriodView: React.FC = () => {
    const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<PeriodFormValues>({
        resolver: zodResolver(periodSchema),
    });

    const fetchPeriods = async () => {
        setLoading(true);
        try {
            const response = await assessmentApi.getPeriods();
            setPeriods(response.data || []);
        } catch (error) {
            toast({ variant: 'destructive', title: '加载失败', description: '无法获取考核周期列表' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPeriods();
    }, []);

    const onSubmit = async (data: PeriodFormValues) => {
        try {
            await assessmentApi.createPeriod(data);
            toast({ title: '创建成功' });
            setIsDialogOpen(false);
            form.reset();
            fetchPeriods();
        } catch (error) {
            toast({ variant: 'destructive', title: '创建失败' });
        }
    };

    const handleLock = async (id: string) => {
        if (!confirm('锁定后将无法修改指标分配，确定吗？')) return;
        try {
            await assessmentApi.lockPeriod(id);
            toast({ title: '已锁定' });
            fetchPeriods();
        } catch (error) {
            toast({ variant: 'destructive', title: '锁定失败' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">考核周期管理</h2>
                    <p className="text-muted-foreground">创建和管理绩效考核的时间窗口</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> 新建周期
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>周期名称</TableHead>
                                <TableHead>开始日期</TableHead>
                                <TableHead>结束日期</TableHead>
                                <TableHead>状态</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center">加载中...</TableCell></TableRow>
                            ) : periods.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center">暂无数据</TableCell></TableRow>
                            ) : (
                                periods.map((period) => (
                                    <TableRow key={period.id}>
                                        <TableCell className="font-medium">{period.name}</TableCell>
                                        <TableCell>{new Date(period.startDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{new Date(period.endDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${period.status === PeriodStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                                                period.status === PeriodStatus.LOCKED ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {period.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {period.status === PeriodStatus.DRAFT && (
                                                <Button variant="outline" size="sm" onClick={() => handleLock(period.id)}>
                                                    <Lock className="mr-2 h-3 w-3" /> 锁定
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>新建考核周期</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label>周期名称</Label>
                            <Input {...form.register('name')} placeholder="如：2024年第一季度考核" />
                            {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>开始日期</Label>
                                <Input type="date" {...form.register('startDate')} />
                            </div>
                            <div className="space-y-2">
                                <Label>结束日期</Label>
                                <Input type="date" {...form.register('endDate')} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                            <Button type="submit">创建</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
