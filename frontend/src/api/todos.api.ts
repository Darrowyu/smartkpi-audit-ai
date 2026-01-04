import { apiClient } from './client';

export enum TodoPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: TodoPriority;
  completed: boolean;
  completedAt?: string;
  relatedType?: string;
  relatedId?: string;
  reminderDays?: number;
  recurrence?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessTodo {
  id: string;
  type: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  link: string;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TodoPriority;
  relatedType?: string;
  relatedId?: string;
  reminderDays?: number;
  recurrence?: string;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: TodoPriority;
  completed?: boolean;
  relatedType?: string;
  relatedId?: string;
  reminderDays?: number;
  recurrence?: string;
}

export interface TodoQueryParams {
  completed?: boolean;
  priority?: TodoPriority;
  page?: number;
  limit?: number;
}

export interface PaginatedTodos {
  data: Todo[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const todosApi = {
  create: async (data: CreateTodoInput): Promise<Todo> => {
    const res = await apiClient.post('/todos', data);
    return res.data;
  },

  getAll: async (params?: TodoQueryParams): Promise<PaginatedTodos> => {
    const res = await apiClient.get('/todos', { params });
    return res.data;
  },

  getBusinessTodos: async (): Promise<BusinessTodo[]> => {
    const res = await apiClient.get('/todos/business');
    return res.data;
  },

  getOne: async (id: string): Promise<Todo> => {
    const res = await apiClient.get(`/todos/${id}`);
    return res.data;
  },

  update: async (id: string, data: UpdateTodoInput): Promise<void> => {
    await apiClient.patch(`/todos/${id}`, data);
  },

  toggle: async (id: string): Promise<Todo> => {
    const res = await apiClient.patch(`/todos/${id}/toggle`);
    return res.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/todos/${id}`);
  },
};
