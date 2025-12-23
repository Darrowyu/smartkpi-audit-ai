import React, { useEffect, useState } from 'react';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';
import { assessmentApi } from '@/api/assessment.api';
import { AssessmentPeriod, PeriodStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const DataEntryView: React.FC = () => {
    const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadPeriods();
    }, []);

    const loadPeriods = async () => {
        try {
            const response = await assessmentApi.getPeriods();
            const allPeriods = response.data || [];
            const activePeriods = allPeriods.filter((p: AssessmentPeriod) =>
                p.status === PeriodStatus.ACTIVE || p.status === PeriodStatus.LOCKED
            );
            setPeriods(activePeriods);
            if (activePeriods.length > 0) {
                setSelectedPeriod(activePeriods[0].id);
            }
        } catch (e) {
            toast({ variant: 'destructive', title: '无法加载考核周期' });
        }
    };

    const handleDownload = async () => {
        if (!selectedPeriod) return;
        try {
            const blob = await assessmentApi.downloadTemplate(selectedPeriod);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `KPI_Template_${periods.find(p => p.id === selectedPeriod)?.name}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            toast({ variant: 'destructive', title: '下载失败', description: '无法生成模板' });
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedPeriod) return;

        setUploading(true);
        try {
            await assessmentApi.uploadData(selectedPeriod, file);
            toast({ title: '上传成功', description: '数据已进入处理队列' });
        } catch (e) {
            toast({ variant: 'destructive', title: '上传失败', description: '文件格式错误或数据无效' });
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">数据填报</h2>
                <p className="text-muted-foreground">下载模板并上传完成的 KPI 考核数据</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>选择考核周期</CardTitle>
                        <CardDescription>选择需要填报数据的周期</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                            <SelectTrigger>
                                <SelectValue placeholder="选择周期" />
                            </SelectTrigger>
                            <SelectContent>
                                {periods.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>下载模板</CardTitle>
                        <CardDescription>获取包含当前分配指标的 Excel 填报模板</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleDownload} disabled={!selectedPeriod} className="w-full">
                            <Download className="mr-2 h-4 w-4" /> 下载专属模板
                        </Button>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>上传数据</CardTitle>
                        <CardDescription>上传填写好的 Excel 文件</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center w-full">
                            <Label
                                htmlFor="dropzone-file"
                                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {uploading ? (
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
                                    ) : (
                                        <>
                                            <Upload className="w-10 h-10 mb-3 text-gray-400" />
                                            <p className="mb-2 text-sm text-gray-500">
                                                <span className="font-semibold">点击上传</span> 或拖拽文件到这里
                                            </p>
                                            <p className="text-xs text-gray-500">仅支持 .xlsx 格式</p>
                                        </>
                                    )}
                                </div>
                                <Input
                                    id="dropzone-file"
                                    type="file"
                                    className="hidden"
                                    accept=".xlsx"
                                    onChange={handleUpload}
                                    disabled={uploading || !selectedPeriod}
                                />
                            </Label>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
