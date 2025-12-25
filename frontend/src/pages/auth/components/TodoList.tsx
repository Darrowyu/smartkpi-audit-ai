import React from 'react';
import { Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TodoPriority = 'high' | 'medium' | 'low';

interface TodoItem {
  id: string;
  title: string;
  dueDate: string;
  priority: TodoPriority;
  completed?: boolean;
}

interface TodoListProps {
  todos: TodoItem[];
  onAddTask?: () => void;
  onToggle?: (id: string) => void;
}

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-blue-500',
};

export const TodoList: React.FC<TodoListProps> = ({ todos, onAddTask, onToggle }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-slate-800">待办事项</h3>
        <Calendar className="w-5 h-5 text-slate-400" />
      </div>
      <div className="space-y-3">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className={`flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
              todo.completed ? 'opacity-50' : ''
            }`}
            onClick={() => onToggle?.(todo.id)}
          >
            <span className={`w-2 h-2 rounded-full ${priorityColors[todo.priority]} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium text-slate-900 ${todo.completed ? 'line-through' : ''}`}>
                {todo.title}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{todo.dueDate}</p>
            </div>
          </div>
        ))}
      </div>
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

export type { TodoItem, TodoPriority };
