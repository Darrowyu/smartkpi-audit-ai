import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Lock } from 'lucide-react';
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

import { assessmentApi } from '@/api/assessment.api';
import { AssessmentPeriod, PeriodStatus } from '@/types';

type PeriodFormValues = {
    name: string;
    startDate: string;
    endDate: string;
};

export const AssessmentPeriodView: React.FC = () => {
    const { t } = useTranslation();
    const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    const periodSchema = z.object({
        name: z.string().min(1, t('assessmentView.enterPeriodName')),
        startDate: z.string().min(1, t('assessmentView.selectStartDate')),
        endDate: z.string().min(1, t('assessmentView.selectEndDate')),
    });

    const form = useForm<PeriodFormValues>({
        resolver: zodResolver(periodSchema),
    });

    const fetchPeriods = async () => {
        setLoading(true);
        try {
            const response = await assessmentApi.getPeriods();
            setPeriods(response.data || []);
        } catch (_error) {
            toast({ variant: 'destructive', title: t('assessmentView.loadFailed'), description: t('assessmentView.loadFailedDesc') });
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
            toast({ title: t('assessmentView.createSuccess') });
            setIsDialogOpen(false);
            form.reset();
            fetchPeriods();
        } catch (_error) {
            toast({ variant: 'destructive', title: t('assessmentView.createFailed') });
        }
    };

    const handleLock = async (id: string) => {
        if (!confirm(t('assessmentView.lockConfirm'))) return;
        try {
            await assessmentApi.lockPeriod(id);
            toast({ title: t('assessmentView.locked') });
            fetchPeriods();
        } catch (_error) {
            toast({ variant: 'destructive', title: t('assessmentView.lockFailed') });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('assessmentView.title')}</h2>
                    <p className="text-muted-foreground">{t('assessmentView.subtitle')}</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> {t('assessmentView.newPeriod')}
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('assessmentView.periodName')}</TableHead>
                                <TableHead>{t('assessmentView.startDate')}</TableHead>
                                <TableHead>{t('assessmentView.endDate')}</TableHead>
                                <TableHead>{t('assessmentView.status')}</TableHead>
                                <TableHead className="text-right">{t('assessmentView.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center">{t('loading')}</TableCell></TableRow>
                            ) : periods.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center">{t('assessmentView.noData')}</TableCell></TableRow>
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
                                                    <Lock className="mr-2 h-3 w-3" /> {t('assessmentView.lock')}
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
                        <DialogTitle>{t('assessmentView.createPeriod')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('assessmentView.periodName')}</Label>
                            <Input {...form.register('name')} placeholder={t('assessmentView.periodNamePlaceholder')} />
                            {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('assessmentView.startDate')}</Label>
                                <Input type="date" {...form.register('startDate')} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('assessmentView.endDate')}</Label>
                                <Input type="date" {...form.register('endDate')} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('cancel')}</Button>
                            <Button type="submit">{t('create')}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
