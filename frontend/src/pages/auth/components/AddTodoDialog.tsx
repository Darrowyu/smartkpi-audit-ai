import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { todosApi, TodoPriority, CreateTodoInput } from '@/api/todos.api';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface AddTodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddTodoDialog: React.FC<AddTodoDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateTodoInput>({
    title: '',
    description: '',
    priority: TodoPriority.MEDIUM,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast({ variant: 'destructive', title: '请输入标题' });
      return;
    }
    setLoading(true);
    try {
      await todosApi.create(form);
      toast({ title: '创建成功' });
      setForm({ title: '', description: '', priority: TodoPriority.MEDIUM });
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast({ variant: 'destructive', title: '创建失败' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>添加待办事项</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="输入待办标题"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="输入详细描述（可选）"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">截止日期</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate || ''}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>优先级</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v as TodoPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TodoPriority.HIGH}>高</SelectItem>
                  <SelectItem value={TodoPriority.MEDIUM}>中</SelectItem>
                  <SelectItem value={TodoPriority.LOW}>低</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reminderDays">提前提醒(天)</Label>
              <Input
                id="reminderDays"
                type="number"
                min={1}
                max={30}
                value={form.reminderDays || ''}
                onChange={(e) =>
                  setForm({ ...form, reminderDays: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder="1-30"
              />
            </div>
            <div className="space-y-2">
              <Label>重复</Label>
              <Select
                value={form.recurrence || 'none'}
                onValueChange={(v) => setForm({ ...form, recurrence: v === 'none' ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不重复</SelectItem>
                  <SelectItem value="weekly">每周</SelectItem>
                  <SelectItem value="monthly">每月</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              创建
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
