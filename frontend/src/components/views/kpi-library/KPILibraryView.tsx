import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { kpiLibraryApi } from '@/api/kpi-library.api';
import { KPIDefinition, FormulaType, AssessmentFrequency } from '@/types';

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

export const KPILibraryView: React.FC = () => {
    const { t } = useTranslation();
    const [kpis, setKpis] = useState<KPIDefinition[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingKPI, setEditingKPI] = useState<KPIDefinition | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { toast } = useToast();

    const kpiSchema = z.object({
        code: z.string().min(1, t('kpiLibrary.enterKpiCode')),
        name: z.string().min(1, t('kpiLibrary.enterKpiName')),
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
        } catch (_error) {
            toast({
                variant: 'destructive',
                title: t('common.loadFailed'),
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
                toast({ title: t('kpiLibrary.updateSuccess') });
            } else {
                await kpiLibraryApi.create(data);
                toast({ title: t('kpiLibrary.createSuccess') });
            }
            setIsDialogOpen(false);
            setEditingKPI(null);
            form.reset();
            fetchKPIs();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: t('kpiLibrary.operationFailed'),
                description: error.response?.data?.message,
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
        if (!confirm(t('kpiLibrary.deleteConfirm'))) return;
        try {
            await kpiLibraryApi.remove(id);
            toast({ title: t('kpiLibrary.deleteSuccess') });
            fetchKPIs();
        } catch (_error) {
            toast({ variant: 'destructive', title: t('kpiLibrary.operationFailed') });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('kpiLibrary.title')}</h2>
                    <p className="text-muted-foreground">{t('kpiLibrary.subtitle')}</p>
                </div>
                <Button onClick={() => { setEditingKPI(null); form.reset(); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> {t('kpiLibrary.createKPI')}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('kpiLibrary.search')}
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
                                    <TableHead>{t('kpiLibrary.kpiCode')}</TableHead>
                                    <TableHead>{t('kpiLibrary.kpiName')}</TableHead>
                                    <TableHead>{t('kpiLibrary.formulaType')}</TableHead>
                                    <TableHead>{t('kpiLibrary.frequency')}</TableHead>
                                    <TableHead>{t('kpiLibrary.defaultWeight')}</TableHead>
                                    <TableHead className="text-right">{t('kpiLibrary.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10">{t('loading')}</TableCell>
                                    </TableRow>
                                ) : kpis.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10">{t('kpiLibrary.noData')}</TableCell>
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
                        <DialogTitle>{editingKPI ? t('kpiLibrary.editKPI') : t('kpiLibrary.createKPI')}</DialogTitle>
                        <DialogDescription>{t('kpiLibrary.subtitle')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('kpiLibrary.kpiCode')}</Label>
                                <Input {...form.register('code')} placeholder="e.g., SALES_RATE" disabled={!!editingKPI} />
                                {form.formState.errors.code && <p className="text-red-500 text-xs">{form.formState.errors.code.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>{t('kpiLibrary.kpiName')}</Label>
                                <Input {...form.register('name')} />
                                {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('kpiLibrary.description')}</Label>
                            <Input {...form.register('description')} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('kpiLibrary.formulaType')}</Label>
                                <Select
                                    onValueChange={(val) => form.setValue('formulaType', val as FormulaType)}
                                    defaultValue={form.watch('formulaType')}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={FormulaType.POSITIVE}>{t('kpiLibrary.formulaHigherBetter')}</SelectItem>
                                        <SelectItem value={FormulaType.NEGATIVE}>{t('kpiLibrary.formulaLowerBetter')}</SelectItem>
                                        <SelectItem value={FormulaType.BINARY}>{t('kpiLibrary.formulaBoolean')}</SelectItem>
                                        <SelectItem value={FormulaType.CUSTOM}>{t('kpiLibrary.formulaCustom')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('kpiLibrary.frequency')}</Label>
                                <Select
                                    onValueChange={(val) => form.setValue('frequency', val as AssessmentFrequency)}
                                    defaultValue={form.watch('frequency')}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={AssessmentFrequency.MONTHLY}>{t('kpiLibrary.freqMonthly')}</SelectItem>
                                        <SelectItem value={AssessmentFrequency.QUARTERLY}>{t('kpiLibrary.freqQuarterly')}</SelectItem>
                                        <SelectItem value={AssessmentFrequency.YEARLY}>{t('kpiLibrary.freqYearly')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>{t('kpiLibrary.defaultWeight')} (%)</Label>
                                <Input type="number" {...form.register('defaultWeight')} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('kpiLibrary.scoreCap')}</Label>
                                <Input type="number" {...form.register('scoreCap')} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('kpiLibrary.scoreFloor')}</Label>
                                <Input type="number" {...form.register('scoreFloor')} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('cancel')}</Button>
                            <Button type="submit">{t('save')}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
