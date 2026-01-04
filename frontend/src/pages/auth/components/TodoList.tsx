import React from 'react';
import { Calendar, Plus, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Todo, BusinessTodo } from '@/api/todos.api';

type CombinedTodo = {
  id: string;
  title: string;
  dueDate?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed?: boolean;
  isBusinessTodo?: boolean;
  link?: string;
  type?: string;
};

interface TodoListProps {
  manualTodos: Todo[];
  businessTodos: BusinessTodo[];
  loading?: boolean;
  onAddTask?: () => void;
  onToggle?: (id: string) => void;
}

const priorityColors: Record<string, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-blue-500',
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

export const TodoList: React.FC<TodoListProps> = ({
  manualTodos,
  businessTodos,
  loading,
  onAddTask,
  onToggle,
}) => {
  const navigate = useNavigate();

  const combinedTodos: CombinedTodo[] = [
    ...businessTodos.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      isBusinessTodo: true,
      link: t.link,
      type: t.type,
    })),
    ...manualTodos.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      completed: t.completed,
      isBusinessTodo: false,
    })),
  ].slice(0, 8);

  const handleClick = (todo: CombinedTodo) => {
    if (todo.isBusinessTodo && todo.link) {
      navigate(todo.link);
    } else if (!todo.isBusinessTodo && onToggle) {
      onToggle(todo.id);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-5 w-5" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-slate-800">待办事项</h3>
        <Calendar className="w-5 h-5 text-slate-400" />
      </div>
      {combinedTodos.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>太棒了，没有待处理事项！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {combinedTodos.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                todo.completed ? 'opacity-50' : ''
              }`}
              onClick={() => handleClick(todo)}
            >
              <span
                className={`w-2 h-2 rounded-full ${priorityColors[todo.priority]} flex-shrink-0`}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium text-slate-900 ${
                    todo.completed ? 'line-through' : ''
                  }`}
                >
                  {todo.title}
                </p>
                {todo.dueDate && (
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(todo.dueDate)}</p>
                )}
              </div>
              {todo.isBusinessTodo && (
                <ExternalLink className="w-4 h-4 text-slate-400" />
              )}
            </div>
          ))}
        </div>
      )}
      {onAddTask && (
        <Button
          variant="outline"
          className="w-full mt-4 text-slate-600 border-dashed"
          onClick={onAddTask}
        >
          <Plus className="w-4 h-4 mr-2" />
          添加任务
        </Button>
      )}
    </div>
  );
};
