import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Plus, Trash2, Pencil, ChevronDown, ChevronRight, Users, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { assignmentApi, KPIAssignmentDto, CreateAssignmentDto } from '@/api/assignment.api';
import { assessmentApi } from '@/api/assessment.api';
import { kpiLibraryApi } from '@/api/kpi-library.api';
import { AssessmentPeriod, PeriodStatus, KPIDefinition } from '@/types';

// 分类配置
const CATEGORY_CONFIG: Record<string, { label: string; fullLabel: string; color: string; description: string }> = {
    FIN: { label: '业绩', fullLabel: '业绩指标', color: 'bg-blue-500', description: '销售和营收相关指标' },
    OPS: { label: '运营', fullLabel: '运营指标', color: 'bg-green-500', description: '日常运营效率相关指标' },
    RND: { label: '创新', fullLabel: '创新指标', color: 'bg-cyan-500', description: '创新和改进相关指标' },
    CUS: { label: '客户', fullLabel: '客户指标', color: 'bg-purple-500', description: '客户服务和满意度相关指标' },
    MKT: { label: '市场', fullLabel: '市场指标', color: 'bg-orange-500', description: '市场推广和品牌相关指标' },
    HR: { label: '人力', fullLabel: '人力资源', color: 'bg-pink-500', description: '人才管理和培训相关指标' },
};

interface AssignmentItem {
    id: string;
    name: string;
    description: string;
    category: string;
    department: string;
    weight: number;
    targetValue: number;
    kpiDefinitionId: string;
}

interface CategoryGroup {
    category: string;
    config: typeof CATEGORY_CONFIG[string];
    totalWeight: number;
    assignments: AssignmentItem[];
}

const getCategoryFromCode = (code: string): string => {
    const prefix = code.split('-')[0]?.toUpperCase() || '';
    return CATEGORY_CONFIG[prefix] ? prefix : 'FIN';
};

// 指标行组件
interface AssignmentRowProps {
    assignment: AssignmentItem;
    onEdit: (assignment: AssignmentItem) => void;
    onDelete: (id: string) => void;
}

const AssignmentRow: React.FC<AssignmentRowProps> = ({ assignment, onEdit, onDelete }) => {
    const categoryConfig = CATEGORY_CONFIG[assignment.category] || CATEGORY_CONFIG.FIN;

    return (
        <div className="flex items-center py-4 px-6 bg-white rounded-lg border border-slate-200 ml-6 hover:shadow-sm transition-shadow">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-900">{assignment.name}</span>
                    <Badge className={cn('text-xs text-white', categoryConfig.color)}>
                        {categoryConfig.label}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-slate-600">
                        {assignment.department}
                    </Badge>
                </div>
                <p className="text-sm text-slate-500">{assignment.description}</p>
            </div>

            <div className="w-20 text-right mr-6">
                <span className="text-lg font-semibold text-slate-700">{assignment.weight}%</span>
                <p className="text-xs text-slate-400">权重</p>
            </div>

            <div className="w-20 mr-6">
                <Progress value={assignment.weight * 2} className="h-1.5" />
            </div>

            <div className="w-20 text-right mr-4">
                <span className="text-sm text-slate-500">目标: {assignment.targetValue}</span>
            </div>

            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(assignment)}>
                    <Pencil className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(assignment.id)}>
                    <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                </Button>
            </div>
        </div>
    );
};

// 分类分组组件
interface CategoryGroupProps {
    group: CategoryGroup;
    expanded: boolean;
    onToggle: () => void;
    onEditAssignment: (assignment: AssignmentItem) => void;
    onEditGroup: (group: CategoryGroup) => void;
    onDeleteAssignment: (id: string) => void;
    onDeleteGroup: (category: string) => void;
    onAdd: (category: string) => void;
}

const CategoryGroup: React.FC<CategoryGroupProps> = ({
    group, expanded, onToggle, onEditAssignment, onEditGroup, onDeleteAssignment, onDeleteGroup, onAdd
}) => {
    return (
        <div className="space-y-2">
            <div className="flex items-center py-4 px-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow">
                <button onClick={onToggle} className="mr-2 p-1 hover:bg-slate-100 rounded">
                    {expanded ? (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                    ) : (
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                    )}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900">{group.config.fullLabel}</span>
                        <Badge className={cn('text-xs text-white', group.config.color)}>
                            {group.config.label}
                        </Badge>
                    </div>
                    <p className="text-sm text-slate-500">{group.config.description}</p>
                </div>

                <div className="w-20 text-right mr-6">
                    <span className="text-xl font-bold text-slate-700">{group.totalWeight}%</span>
                    <p className="text-xs text-slate-400">权重</p>
                </div>

                <div className="w-28 mr-6">
                    <Progress value={group.totalWeight} className="h-2" />
                </div>

                <div className="w-20 text-right mr-4">
                    <span className="text-sm text-slate-500">{group.assignments.length} 项指标</span>
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAdd(group.category)}>
                        <Plus className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditGroup(group)}>
                        <Pencil className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDeleteGroup(group.category)}>
                        <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                    </Button>
                </div>
            </div>

            {expanded && (
                <div className="space-y-2 pl-4">
                    {group.assignments.map(assignment => (
                        <AssignmentRow
                            key={assignment.id}
                            assignment={assignment}
                            onEdit={onEditAssignment}
                            onDelete={onDeleteAssignment}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// 编辑类型
type EditType = 'none' | 'group' | 'assignment' | 'addChild';

// 主组件
export const AssignmentView: React.FC = () => {
    const { toast } = useToast();

    const [data, setData] = useState<CategoryGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    const [kpiDefinitions, setKpiDefinitions] = useState<KPIDefinition[]>([]);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['FIN', 'OPS', 'RND', 'CUS', 'MKT', 'HR']));
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editType, setEditType] = useState<EditType>('none');
    const [editingAssignment, setEditingAssignment] = useState<AssignmentItem | null>(null);
    const [editingGroup, setEditingGroup] = useState<CategoryGroup | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    const [form, setForm] = useState({
        name: '',
        description: '',
        department: '',
        weight: '10',
        targetValue: '100',
        kpiDefinitionId: '',
    });

    // 加载数据
    const loadPeriods = useCallback(async () => {
        try {
            const response = await assessmentApi.getPeriods();
            const allPeriods = response.data || [];
            const activePeriods = allPeriods.filter((p: AssessmentPeriod) =>
                p.status === PeriodStatus.ACTIVE || p.status === PeriodStatus.DRAFT
            );
            setPeriods(activePeriods);
            if (activePeriods.length > 0) setSelectedPeriod(activePeriods[0].id);
        } catch {
            toast({ variant: 'destructive', title: '加载周期失败' });
        }
    }, [toast]);

    const loadKpiDefinitions = useCallback(async () => {
        try {
            const res = await kpiLibraryApi.findAll({});
            setKpiDefinitions(res.data || res || []);
        } catch { /* silent */ }
    }, []);

    const loadAssignments = useCallback(async () => {
        if (!selectedPeriod) return;
        setLoading(true);
        try {
            const assignments = await assignmentApi.findByPeriod(selectedPeriod);
            const grouped: Record<string, AssignmentItem[]> = {};
            
            assignments.forEach((a: KPIAssignmentDto) => {
                const category = getCategoryFromCode(a.kpiDefinition.code);
                if (!grouped[category]) grouped[category] = [];
                grouped[category].push({
                    id: a.id,
                    name: a.kpiDefinition.name,
                    description: a.kpiDefinition.description || '',
                    category,
                    department: '全员',
                    weight: a.weight,
                    targetValue: a.targetValue,
                    kpiDefinitionId: a.kpiDefinitionId,
                });
            });

            const categoryGroups: CategoryGroup[] = Object.entries(grouped).map(([cat, items]) => ({
                category: cat,
                config: CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.FIN,
                totalWeight: items.reduce((sum, i) => sum + i.weight, 0),
                assignments: items,
            }));

            setData(categoryGroups);
        } catch {
            toast({ variant: 'destructive', title: '加载分配失败' });
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod, toast]);

    useEffect(() => { loadPeriods(); loadKpiDefinitions(); }, [loadPeriods, loadKpiDefinitions]);
    useEffect(() => { if (selectedPeriod) loadAssignments(); }, [selectedPeriod, loadAssignments]);

    const totalWeight = useMemo(() => {
        return data.reduce((sum, group) => sum + group.totalWeight, 0);
    }, [data]);

    const weightStatus = totalWeight === 100 ? 'success' : totalWeight > 100 ? 'error' : 'warning';

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    // 新建指标（顶部按钮）
    const handleOpenCreate = () => {
        setEditType('assignment');
        setEditingAssignment(null);
        setEditingGroup(null);
        setSelectedCategory('FIN');
        setForm({ name: '', description: '', department: '', weight: '10', targetValue: '100', kpiDefinitionId: '' });
        setIsDialogOpen(true);
    };

    // 添加子指标（分组+按钮）
    const handleAddChild = (category: string) => {
        setEditType('addChild');
        setEditingAssignment(null);
        setEditingGroup(null);
        setSelectedCategory(category);
        setForm({ name: '', description: '', department: '', weight: '10', targetValue: '100', kpiDefinitionId: '' });
        setIsDialogOpen(true);
    };

    // 编辑分组（现在只读展示，不允许编辑）
    const handleEditGroup = (group: CategoryGroup) => {
        setEditType('group');
        setEditingGroup(group);
        setEditingAssignment(null);
        setSelectedCategory(group.category);
        setForm({
            name: group.config.fullLabel,
            description: group.config.description,
            department: '',
            weight: String(group.totalWeight),
            targetValue: '100',
            kpiDefinitionId: '',
        });
        setIsDialogOpen(true);
    };

    // 编辑子指标
    const handleEditAssignment = (assignment: AssignmentItem) => {
        setEditType('assignment');
        setEditingAssignment(assignment);
        setEditingGroup(null);
        setSelectedCategory(assignment.category);
        setForm({
            name: assignment.name,
            description: assignment.description,
            department: assignment.department,
            weight: String(assignment.weight),
            targetValue: String(assignment.targetValue),
            kpiDefinitionId: assignment.kpiDefinitionId,
        });
        setIsDialogOpen(true);
    };

    // 删除子指标
    const handleDeleteAssignment = async (id: string) => {
        if (!confirm('确定要删除此指标吗？')) return;
        try {
            await assignmentApi.remove(id);
            toast({ title: '删除成功' });
            loadAssignments();
        } catch {
            toast({ variant: 'destructive', title: '删除失败' });
        }
    };

    // 删除分组
    const handleDeleteGroup = async (category: string) => {
        if (!confirm('确定要删除此分组及其所有指标吗？')) return;
        const group = data.find(g => g.category === category);
        if (!group) return;
        try {
            await Promise.all(group.assignments.map(a => assignmentApi.remove(a.id)));
            toast({ title: '删除成功' });
            loadAssignments();
        } catch {
            toast({ variant: 'destructive', title: '删除失败' });
        }
    };

    // 提交表单
    const handleSubmit = async () => {
        if (!form.kpiDefinitionId || !form.weight || !selectedPeriod) {
            toast({ variant: 'destructive', title: '请选择KPI指标和填写权重' });
            return;
        }

        try {
            if (editType === 'assignment' && editingAssignment) {
                await assignmentApi.update(editingAssignment.id, {
                    targetValue: parseFloat(form.targetValue) || 100,
                    weight: parseInt(form.weight),
                });
                toast({ title: '更新成功' });
            } else {
                const createData: CreateAssignmentDto = {
                    kpiDefinitionId: form.kpiDefinitionId,
                    periodId: selectedPeriod,
                    targetValue: parseFloat(form.targetValue) || 100,
                    weight: parseInt(form.weight),
                };
                await assignmentApi.create(createData);
                toast({ title: '创建成功' });
            }
            setIsDialogOpen(false);
            loadAssignments();
        } catch {
            toast({ variant: 'destructive', title: '操作失败' });
        }
    };

    // 获取对话框标题
    const getDialogTitle = () => {
        if (editType === 'group') return '编辑指标';
        if (editType === 'addChild') return '添加子指标';
        if (editingAssignment) return '编辑指标';
        return '新建指标';
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">指标分配</h1>
                    <p className="text-slate-500">设置KPI指标体系，分配权重和考核对象</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="选择考核周期" />
                        </SelectTrigger>
                        <SelectContent>
                            {periods.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleOpenCreate} disabled={!selectedPeriod}>
                        <Plus className="mr-2 h-4 w-4" /> 新建指标
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-500">总权重分配</span>
                    <span className={cn(
                        'text-3xl font-bold',
                        weightStatus === 'success' ? 'text-emerald-600' : weightStatus === 'error' ? 'text-red-500' : 'text-amber-500'
                    )}>
                        {totalWeight}%
                        <span className="text-lg font-normal text-slate-400 ml-1">/ 100%</span>
                    </span>
                </div>
                <Progress
                    value={Math.min(totalWeight, 100)}
                    className={cn('h-3', weightStatus === 'success' && '[&>div]:bg-emerald-500')}
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
            ) : data.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    {selectedPeriod ? '暂无分配的指标，请点击"新建指标"添加' : '请先选择考核周期'}
                </div>
            ) : (
                <div className="space-y-4">
                    {data.map(group => (
                        <CategoryGroup
                            key={group.category}
                            group={group}
                            expanded={expandedCategories.has(group.category)}
                            onToggle={() => toggleCategory(group.category)}
                            onEditAssignment={handleEditAssignment}
                            onEditGroup={handleEditGroup}
                            onDeleteAssignment={handleDeleteAssignment}
                            onDeleteGroup={handleDeleteGroup}
                            onAdd={handleAddChild}
                        />
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{getDialogTitle()}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>选择KPI指标 <span className="text-red-500">*</span></Label>
                            <Select 
                                value={form.kpiDefinitionId} 
                                onValueChange={v => setForm(f => ({ ...f, kpiDefinitionId: v }))}
                                disabled={!!editingAssignment}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="选择要分配的KPI指标" />
                                </SelectTrigger>
                                <SelectContent>
                                    {kpiDefinitions.map(kpi => (
                                        <SelectItem key={kpi.id} value={kpi.id}>
                                            {kpi.code} - {kpi.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>目标值 <span className="text-red-500">*</span></Label>
                                <Input
                                    type="number"
                                    placeholder="100"
                                    value={form.targetValue}
                                    onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>权重 (%) <span className="text-red-500">*</span></Label>
                                <Input
                                    type="number"
                                    placeholder="10"
                                    value={form.weight}
                                    onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                        <Button onClick={handleSubmit}>保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
