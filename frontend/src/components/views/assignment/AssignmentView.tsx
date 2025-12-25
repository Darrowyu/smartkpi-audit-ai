import React, { useState, useMemo } from 'react';
import {
    Plus, Trash2, Pencil, ChevronDown, ChevronRight, Users
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

// 分类配置
const CATEGORY_CONFIG: Record<string, { label: string; fullLabel: string; color: string; description: string }> = {
    FIN: { label: '业绩', fullLabel: '业绩指标', color: 'bg-blue-500', description: '销售和营收相关指标' },
    OPS: { label: '运营', fullLabel: '运营指标', color: 'bg-green-500', description: '日常运营效率相关指标' },
    RND: { label: '创新', fullLabel: '创新指标', color: 'bg-cyan-500', description: '创新和改进相关指标' },
    TEAM: { label: '协作', fullLabel: '团队协作', color: 'bg-amber-500', description: '团队合作和沟通相关指标' },
};

// 模拟数据类型
interface MockAssignment {
    id: string;
    name: string;
    description: string;
    category: string;
    department: string;
    weight: number;
    employeeCount: number;
}

interface MockCategoryGroup {
    category: string;
    config: typeof CATEGORY_CONFIG[string];
    totalWeight: number;
    totalEmployees: number;
    assignments: MockAssignment[];
}

// 模拟数据
const MOCK_DATA: MockCategoryGroup[] = [
    {
        category: 'FIN',
        config: CATEGORY_CONFIG.FIN,
        totalWeight: 40,
        totalEmployees: 25,
        assignments: [
            { id: '1', name: '销售额达成率', description: '完成年度销售目标的百分比', category: 'FIN', department: '销售部', weight: 20, employeeCount: 15 },
            { id: '2', name: '新客户获取', description: '本季度新增客户数量', category: 'FIN', department: '销售部', weight: 10, employeeCount: 10 },
            { id: '3', name: '客户续约率', description: '老客户续约比例', category: 'FIN', department: '客户成功部', weight: 10, employeeCount: 8 },
        ],
    },
    {
        category: 'OPS',
        config: CATEGORY_CONFIG.OPS,
        totalWeight: 30,
        totalEmployees: 30,
        assignments: [
            { id: '4', name: '项目交付及时率', description: '按时完成项目的比例', category: 'OPS', department: '研发部', weight: 15, employeeCount: 20 },
            { id: '5', name: '客户满意度', description: '客户满意度评分', category: 'OPS', department: '客服部', weight: 15, employeeCount: 10 },
        ],
    },
    {
        category: 'RND',
        config: CATEGORY_CONFIG.RND,
        totalWeight: 20,
        totalEmployees: 18,
        assignments: [
            { id: '6', name: '流程优化建议', description: '提出并实施的流程优化数量', category: 'RND', department: '全员', weight: 10, employeeCount: 18 },
            { id: '7', name: '技术创新', description: '新技术应用和创新项目', category: 'RND', department: '研发部', weight: 10, employeeCount: 12 },
        ],
    },
    {
        category: 'TEAM',
        config: CATEGORY_CONFIG.TEAM,
        totalWeight: 10,
        totalEmployees: 50,
        assignments: [
            { id: '8', name: '团队协作', description: '团队合作和沟通相关指标', category: 'TEAM', department: '全员', weight: 10, employeeCount: 50 },
        ],
    },
];

// 指标行组件
interface AssignmentRowProps {
    assignment: MockAssignment;
    onEdit: (assignment: MockAssignment) => void;
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

            <div className="w-16 flex items-center gap-1 text-slate-500 mr-4">
                <Users className="h-4 w-4" />
                <span className="text-sm">{assignment.employeeCount}</span>
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
    group: MockCategoryGroup;
    expanded: boolean;
    onToggle: () => void;
    onEditAssignment: (assignment: MockAssignment) => void;
    onEditGroup: (group: MockCategoryGroup) => void;
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

                <div className="w-16 flex items-center gap-1 text-slate-500 mr-4">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{group.totalEmployees}</span>
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

    const [data, setData] = useState<MockCategoryGroup[]>(MOCK_DATA);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['FIN', 'OPS', 'RND', 'TEAM']));
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editType, setEditType] = useState<EditType>('none');
    const [editingAssignment, setEditingAssignment] = useState<MockAssignment | null>(null);
    const [editingGroup, setEditingGroup] = useState<MockCategoryGroup | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    const [form, setForm] = useState({
        name: '',
        description: '',
        department: '',
        weight: '10',
    });

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
        setForm({ name: '', description: '', department: '', weight: '10' });
        setIsDialogOpen(true);
    };

    // 添加子指标（分组+按钮）
    const handleAddChild = (category: string) => {
        setEditType('addChild');
        setEditingAssignment(null);
        setEditingGroup(null);
        setSelectedCategory(category);
        setForm({ name: '', description: '', department: '', weight: '10' });
        setIsDialogOpen(true);
    };

    // 编辑分组
    const handleEditGroup = (group: MockCategoryGroup) => {
        setEditType('group');
        setEditingGroup(group);
        setEditingAssignment(null);
        setSelectedCategory(group.category);
        setForm({
            name: group.config.fullLabel,
            description: group.config.description,
            department: '',
            weight: String(group.totalWeight),
        });
        setIsDialogOpen(true);
    };

    // 编辑子指标
    const handleEditAssignment = (assignment: MockAssignment) => {
        setEditType('assignment');
        setEditingAssignment(assignment);
        setEditingGroup(null);
        setSelectedCategory(assignment.category);
        setForm({
            name: assignment.name,
            description: assignment.description,
            department: assignment.department,
            weight: String(assignment.weight),
        });
        setIsDialogOpen(true);
    };

    // 删除子指标
    const handleDeleteAssignment = (id: string) => {
        if (!confirm('确定要删除此指标吗？')) return;
        setData(prev => prev.map(group => ({
            ...group,
            assignments: group.assignments.filter(a => a.id !== id),
            totalWeight: group.assignments.filter(a => a.id !== id).reduce((sum, a) => sum + a.weight, 0),
            totalEmployees: group.assignments.filter(a => a.id !== id).reduce((sum, a) => sum + a.employeeCount, 0),
        })).filter(group => group.assignments.length > 0));
        toast({ title: '删除成功' });
    };

    // 删除分组
    const handleDeleteGroup = (category: string) => {
        if (!confirm('确定要删除此分组及其所有指标吗？')) return;
        setData(prev => prev.filter(g => g.category !== category));
        toast({ title: '删除成功' });
    };

    // 提交表单
    const handleSubmit = () => {
        if (!form.name || !form.weight) {
            toast({ variant: 'destructive', title: '请填写必填项' });
            return;
        }

        if (editType === 'group' && editingGroup) {
            // 更新分组
            setData(prev => prev.map(group =>
                group.category === editingGroup.category
                    ? {
                        ...group,
                        config: {
                            ...group.config,
                            fullLabel: form.name,
                            description: form.description,
                        },
                    }
                    : group
            ));
            toast({ title: '更新成功' });
        } else if (editType === 'assignment' && editingAssignment) {
            // 更新子指标
            setData(prev => prev.map(group => ({
                ...group,
                assignments: group.assignments.map(a =>
                    a.id === editingAssignment.id
                        ? { ...a, name: form.name, description: form.description, department: form.department, weight: parseInt(form.weight) }
                        : a
                ),
                totalWeight: group.assignments.reduce((sum, a) =>
                    sum + (a.id === editingAssignment.id ? parseInt(form.weight) : a.weight), 0
                ),
            })));
            toast({ title: '更新成功' });
        } else {
            // 新建子指标
            const newAssignment: MockAssignment = {
                id: `new_${Date.now()}`,
                name: form.name,
                description: form.description,
                category: selectedCategory || 'FIN',
                department: form.department || '全员',
                weight: parseInt(form.weight),
                employeeCount: Math.floor(Math.random() * 20) + 5,
            };

            setData(prev => {
                const existingGroup = prev.find(g => g.category === (selectedCategory || 'FIN'));
                if (existingGroup) {
                    return prev.map(group =>
                        group.category === (selectedCategory || 'FIN')
                            ? {
                                ...group,
                                assignments: [...group.assignments, newAssignment],
                                totalWeight: group.totalWeight + newAssignment.weight,
                                totalEmployees: group.totalEmployees + newAssignment.employeeCount,
                            }
                            : group
                    );
                }
                return prev;
            });
            toast({ title: '创建成功' });
        }

        setIsDialogOpen(false);
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
                <Button onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" /> 新建指标
                </Button>
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{getDialogTitle()}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>指标名称</Label>
                            <Input
                                placeholder="例如：销售额达成率"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                className="border-[#1E4B8E] focus:ring-[#1E4B8E]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>指标描述</Label>
                            <textarea
                                placeholder="描述该指标的考核内容和标准"
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                className="w-full min-h-[80px] px-3 py-2 text-sm border border-slate-200 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-[#1E4B8E] focus:border-transparent"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>权重 (%)</Label>
                                <Input
                                    type="number"
                                    placeholder="10"
                                    value={form.weight}
                                    onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>类别</Label>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={editType === 'group' || editType === 'addChild'}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择类别" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                                {config.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {editType !== 'group' && (
                            <div className="space-y-2">
                                <Label>所属部门</Label>
                                <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择部门" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="全员">全员</SelectItem>
                                        <SelectItem value="销售部">销售部</SelectItem>
                                        <SelectItem value="研发部">研发部</SelectItem>
                                        <SelectItem value="客服部">客服部</SelectItem>
                                        <SelectItem value="客户成功部">客户成功部</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
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
