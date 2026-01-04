# 首页(LandingPage)功能优化 实施计划

**目标：** 优化首页功能，接入真实API数据，实现待办系统，修复所有功能缺失

**架构：** 后端新增Todo模块(Prisma+NestJS)，业务待办通过聚合查询生成，前端组件改造接入API

**技术栈：** NestJS, Prisma, PostgreSQL, React, TypeScript

---

## 需求确认

- **待办方案**: 混合方案 - 自动生成业务待办 + 手动添加自定义待办
- **业务待办范围**: 完整版 - 包含数据提交、审批、自评、周期到期、低绩效、校准、面谈
- **手动待办功能**: 增强版 - 支持描述、关联业务、提醒、重复任务
- **通知展示**: 复用顶部导航栏已有的通知下拉面板

---

## 设计详情

### 1. 数据库与后端 - Todo模块

新建 `Todo` 模型 (`backend/prisma/schema.prisma`):

```prisma
model Todo {
  id          String       @id @default(uuid())
  title       String
  description String?      @db.Text
  dueDate     DateTime?    @map("due_date")
  priority    TodoPriority @default(MEDIUM)
  completed   Boolean      @default(false)
  completedAt DateTime?    @map("completed_at")
  
  // 关联业务
  relatedType String?      @map("related_type") // employee/period/kpi
  relatedId   String?      @map("related_id")
  
  // 提醒
  reminderDays Int?        @map("reminder_days") // 到期前N天提醒
  
  // 重复任务
  recurrence  String?      // weekly/monthly/null
  
  userId      String       @map("user_id")
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  companyId   String       @map("company_id")
  
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([userId])
  @@index([companyId])
  @@index([dueDate])
  @@map("todos")
}

enum TodoPriority {
  HIGH
  MEDIUM
  LOW
}
```

后端新建 `modules/todos/` 模块，提供 CRUD API。

### 2. 后端 - 业务待办自动生成服务

在 `TodosService` 中新增 `getBusinessTodos()` 方法，根据用户角色动态聚合：

| 待办类型 | 数据来源 | 适用角色 |
|---------|---------|---------|
| 待提交数据填报 | `DataSubmission` 状态=DRAFT | 所有用户 |
| 未完成自评 | `SelfEvaluation` 当前周期未提交 | 所有用户 |
| 待审批提交 | `DataSubmission` 状态=PENDING | MANAGER+ |
| 即将到期周期 | `AssessmentPeriod` 结束日期<7天 | 所有用户 |
| 低绩效关注 | `EmployeeScore` 分数<60 | MANAGER+ |
| 待处理校准会议 | `Calibration` 状态=SCHEDULED | MANAGER+ |
| 待安排绩效面谈 | `Interview` 当前周期未安排 | MANAGER+ |

返回统一格式：
```typescript
interface BusinessTodo {
  id: string;           // 业务ID
  type: 'submission' | 'evaluation' | 'approval' | 'period' | 'performance' | 'calibration' | 'interview';
  title: string;
  dueDate?: Date;
  priority: 'high' | 'medium' | 'low';
  link: string;         // 跳转路径
}
```

API: `GET /todos/business` 返回业务待办列表

### 3. 前端 - 首页组件改造

#### 3.1 数据流改造 (`LandingPage.tsx`)

```tsx
// 新增数据加载
const [notifications, setNotifications] = useState([]);
const [businessTodos, setBusinessTodos] = useState([]);
const [manualTodos, setManualTodos] = useState([]);
const [loading, setLoading] = useState(true);

// 调用真实API
await Promise.all([
  notificationsApi.getNotifications({ limit: 5 }),
  todosApi.getBusinessTodos(),
  todosApi.getManualTodos(),
  reportsApi.getOverview(periodId),
]);
```

#### 3.2 组件功能修复

| 组件 | 修复内容 |
|------|---------|
| `Notifications` | 接入API；"查看全部"触发顶栏通知面板展开 |
| `TodoList` | 合并展示业务待办+手动待办；实现添加/完成功能 |
| `WelcomeBanner` | 修正 `activeKPIs` 语义（改为"待处理任务数"） |
| `MonthlyPerformance` | 接入用户实际绩效数据或显示"暂无数据" |

#### 3.3 新增待办弹窗

点击"添加任务"弹出表单：
- 标题（必填）
- 描述（可选）
- 截止日期（可选）
- 优先级（高/中/低）
- 关联业务（可选下拉：员工/周期/KPI）
- 提醒天数（可选）
- 重复周期（可选：每周/每月）

### 4. 权限区分与空状态处理

#### 4.1 按角色差异化显示

```tsx
const { user } = useAuth();
const isManager = ['GROUP_ADMIN', 'MANAGER'].includes(user.role);

// 快速导航：普通用户隐藏"团队协作"入口
const navItems = isManager 
  ? defaultItems 
  : defaultItems.filter(item => item.id !== 'team');

// 业务待办：后端已按角色过滤，前端无需额外处理
```

#### 4.2 加载与空状态

| 场景 | 处理方式 |
|------|---------|
| 数据加载中 | 显示 Skeleton 占位符 |
| 通知为空 | "暂无新通知" + 图标 |
| 待办为空 | "太棒了，没有待处理事项！" + 图标 |
| 本月表现无数据 | "本周期暂无绩效数据" |

#### 4.3 错误处理

- API 失败时静默降级，显示空状态而非报错
- 关键操作（添加待办、标记完成）失败时 toast 提示

---

---

## 实施任务

### 任务 1: 新增 Todo 模型到 Prisma Schema

**文件：**
- 修改: `backend/prisma/schema.prisma`

**步骤1: 添加 TodoPriority 枚举和 Todo 模型**

在 schema.prisma 文件末尾添加：

```prisma
// ============================================
// Todo System (待办事项系统)
// ============================================

enum TodoPriority {
  HIGH
  MEDIUM
  LOW
}

model Todo {
  id          String       @id @default(uuid())
  title       String
  description String?      @db.Text
  dueDate     DateTime?    @map("due_date")
  priority    TodoPriority @default(MEDIUM)
  completed   Boolean      @default(false)
  completedAt DateTime?    @map("completed_at")

  relatedType  String?     @map("related_type")
  relatedId    String?     @map("related_id")
  reminderDays Int?        @map("reminder_days")
  recurrence   String?

  userId    String @map("user_id")
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  companyId String @map("company_id")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([companyId])
  @@index([dueDate])
  @@index([completed])
  @@map("todos")
}
```

**步骤2: 更新 User 模型添加 todos 关系**

在 User 模型的 Relations 部分添加：
```prisma
todos         Todo[]
```

**步骤3: 提交**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat(prisma): add Todo model for task management"
```

---

### 任务 2: 运行数据库迁移

**步骤1: 生成并应用迁移**

```bash
cd backend
npx prisma migrate dev --name add_todo_model
```

预期: 迁移成功，创建 todos 表

**步骤2: 生成 Prisma Client**

```bash
npx prisma generate
```

**步骤3: 提交迁移文件**

```bash
git add backend/prisma/migrations/
git commit -m "feat(db): add todo table migration"
```

---

### 任务 3: 创建 Todos 模块 DTO

**文件：**
- 创建: `backend/src/modules/todos/dto/todo.dto.ts`

**步骤1: 创建 DTO 文件**

```typescript
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export enum TodoPriorityEnum {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export class CreateTodoDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(TodoPriorityEnum)
  priority?: TodoPriorityEnum;

  @IsOptional()
  @IsString()
  relatedType?: string;

  @IsOptional()
  @IsUUID()
  relatedId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  reminderDays?: number;

  @IsOptional()
  @IsString()
  recurrence?: string;
}

export class UpdateTodoDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(TodoPriorityEnum)
  priority?: TodoPriorityEnum;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsString()
  relatedType?: string;

  @IsOptional()
  @IsUUID()
  relatedId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  reminderDays?: number;

  @IsOptional()
  @IsString()
  recurrence?: string;
}

export class QueryTodoDto {
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsEnum(TodoPriorityEnum)
  priority?: TodoPriorityEnum;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
```

**步骤2: 提交**

```bash
git add backend/src/modules/todos/dto/todo.dto.ts
git commit -m "feat(todos): add todo DTOs"
```

---

### 任务 4: 创建 Todos Service

**文件：**
- 创建: `backend/src/modules/todos/todos.service.ts`

**步骤1: 创建 Service 文件**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreateTodoDto, UpdateTodoDto, QueryTodoDto } from './dto/todo.dto';

export interface BusinessTodo {
  id: string;
  type: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  link: string;
}

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTodoDto, userId: string, companyId: string) {
    return this.prisma.todo.create({
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        userId,
        companyId,
      },
    });
  }

  async findAll(userId: string, query: QueryTodoDto) {
    const { completed, priority, page = '1', limit = '20' } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      userId,
      ...(typeof completed === 'boolean' && { completed }),
      ...(priority && { priority }),
    };

    const [data, total] = await Promise.all([
      this.prisma.todo.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.todo.count({ where }),
    ]);

    return {
      data,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    };
  }

  async findOne(id: string, userId: string) {
    return this.prisma.todo.findFirst({ where: { id, userId } });
  }

  async update(id: string, dto: UpdateTodoDto, userId: string) {
    const updateData: any = { ...dto };
    if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);
    if (dto.completed === true) updateData.completedAt = new Date();
    if (dto.completed === false) updateData.completedAt = null;

    return this.prisma.todo.updateMany({ where: { id, userId }, data: updateData });
  }

  async remove(id: string, userId: string) {
    return this.prisma.todo.deleteMany({ where: { id, userId } });
  }

  async toggleComplete(id: string, userId: string) {
    const todo = await this.prisma.todo.findFirst({ where: { id, userId } });
    if (!todo) return null;
    return this.prisma.todo.update({
      where: { id },
      data: { completed: !todo.completed, completedAt: !todo.completed ? new Date() : null },
    });
  }

  async getBusinessTodos(userId: string, companyId: string, role: UserRole): Promise<BusinessTodo[]> {
    const todos: BusinessTodo[] = [];
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const isManager = ['GROUP_ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(role);

    const activePeriods = await this.prisma.assessmentPeriod.findMany({
      where: { companyId, status: 'ACTIVE' },
      orderBy: { endDate: 'asc' },
    });

    for (const period of activePeriods) {
      if (period.endDate <= sevenDaysLater) {
        todos.push({
          id: `period-${period.id}`,
          type: 'period_expiring',
          title: `考核周期"${period.name}"即将截止`,
          dueDate: period.endDate,
          priority: period.endDate <= now ? 'HIGH' : 'MEDIUM',
          link: '/app/data-entry',
        });
      }
    }

    if (isManager) {
      const pendingSubmissions = await this.prisma.dataSubmission.findMany({
        where: { companyId, status: 'PENDING' },
        include: { period: { select: { name: true } } },
        take: 10,
      });
      for (const sub of pendingSubmissions) {
        todos.push({
          id: `approval-${sub.id}`,
          type: 'approval_pending',
          title: `${sub.period.name} 数据提交待审批`,
          priority: 'HIGH',
          link: '/app/data-approval',
        });
      }

      const lowPerformers = await this.prisma.employeePerformance.findMany({
        where: { companyId, totalScore: { lt: 60 } },
        include: { },
        take: 5,
      });
      for (const perf of lowPerformers) {
        todos.push({
          id: `low-perf-${perf.id}`,
          type: 'low_performance',
          title: `员工绩效低于60分需关注`,
          priority: 'MEDIUM',
          link: '/app/reports',
        });
      }

      const pendingCalibrations = await this.prisma.calibrationSession.findMany({
        where: { companyId, status: 'draft' },
        take: 5,
      });
      for (const cal of pendingCalibrations) {
        todos.push({
          id: `calibration-${cal.id}`,
          type: 'calibration_pending',
          title: `校准会议"${cal.name}"待处理`,
          priority: 'MEDIUM',
          link: '/app/calibration',
        });
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { linkedEmployeeId: true },
      });
      if (user?.linkedEmployeeId && activePeriods.length > 0) {
        const missingInterviews = await this.prisma.performanceInterview.findMany({
          where: {
            companyId,
            periodId: activePeriods[0].id,
            interviewerId: userId,
            conductedAt: null,
          },
          take: 5,
        });
        for (const int of missingInterviews) {
          todos.push({
            id: `interview-${int.id}`,
            type: 'interview_pending',
            title: `绩效面谈待安排`,
            dueDate: int.scheduledAt,
            priority: int.scheduledAt < now ? 'HIGH' : 'MEDIUM',
            link: '/app/interview',
          });
        }
      }
    }

    const draftSubmissions = await this.prisma.dataSubmission.findMany({
      where: { companyId, submittedById: userId, status: 'DRAFT' },
      include: { period: { select: { name: true } } },
      take: 5,
    });
    for (const sub of draftSubmissions) {
      todos.push({
        id: `draft-${sub.id}`,
        type: 'submission_draft',
        title: `${sub.period.name} 数据填报未提交`,
        priority: 'MEDIUM',
        link: '/app/data-entry',
      });
    }

    return todos.sort((a, b) => {
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}
```

**步骤2: 提交**

```bash
git add backend/src/modules/todos/todos.service.ts
git commit -m "feat(todos): add todos service with business todos aggregation"
```

---

### 任务 5: 创建 Todos Controller

**文件：**
- 创建: `backend/src/modules/todos/todos.controller.ts`

**步骤1: 创建 Controller 文件**

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TodosService } from './todos.service';
import { CreateTodoDto, UpdateTodoDto, QueryTodoDto } from './dto/todo.dto';

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private todosService: TodosService) {}

  @Post()
  async create(@Body() dto: CreateTodoDto, @Request() req) {
    return this.todosService.create(dto, req.user.userId, req.user.companyId);
  }

  @Get()
  async findAll(@Request() req, @Query() query: QueryTodoDto) {
    return this.todosService.findAll(req.user.userId, query);
  }

  @Get('business')
  async getBusinessTodos(@Request() req) {
    return this.todosService.getBusinessTodos(
      req.user.userId,
      req.user.companyId,
      req.user.role,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.todosService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTodoDto, @Request() req) {
    await this.todosService.update(id, dto, req.user.userId);
    return { message: '更新成功' };
  }

  @Patch(':id/toggle')
  async toggleComplete(@Param('id') id: string, @Request() req) {
    const todo = await this.todosService.toggleComplete(id, req.user.userId);
    return todo || { message: '待办不存在' };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.todosService.remove(id, req.user.userId);
    return { message: '删除成功' };
  }
}
```

**步骤2: 提交**

```bash
git add backend/src/modules/todos/todos.controller.ts
git commit -m "feat(todos): add todos controller"
```

---

### 任务 6: 创建 Todos Module 并注册

**文件：**
- 创建: `backend/src/modules/todos/todos.module.ts`
- 修改: `backend/src/app.module.ts`

**步骤1: 创建 Module 文件**

```typescript
import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';

@Module({
  controllers: [TodosController],
  providers: [TodosService],
  exports: [TodosService],
})
export class TodosModule {}
```

**步骤2: 在 app.module.ts 中注册**

添加 import:
```typescript
import { TodosModule } from './modules/todos/todos.module';
```

在 imports 数组中添加:
```typescript
TodosModule,
```

**步骤3: 提交**

```bash
git add backend/src/modules/todos/todos.module.ts backend/src/app.module.ts
git commit -m "feat(todos): register todos module"
```

---

### 任务 7: 创建前端 todos.api.ts

**文件：**
- 创建: `frontend/src/api/todos.api.ts`

**步骤1: 创建 API 文件**

```typescript
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
```

**步骤2: 提交**

```bash
git add frontend/src/api/todos.api.ts
git commit -m "feat(frontend): add todos API client"
```

---

### 任务 8: 创建 AddTodoDialog 组件

**文件：**
- 创建: `frontend/src/pages/auth/components/AddTodoDialog.tsx`

**步骤1: 创建对话框组件**

```tsx
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
```

**步骤2: 导出组件**

在 `frontend/src/pages/auth/components/index.ts` 添加:
```typescript
export { AddTodoDialog } from './AddTodoDialog';
```

**步骤3: 提交**

```bash
git add frontend/src/pages/auth/components/AddTodoDialog.tsx frontend/src/pages/auth/components/index.ts
git commit -m "feat(frontend): add AddTodoDialog component"
```

---

### 任务 9: 改造 TodoList 组件

**文件：**
- 修改: `frontend/src/pages/auth/components/TodoList.tsx`

**步骤1: 重写 TodoList 组件支持真实数据和交互**

```tsx
import React from 'react';
import { Calendar, Plus, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Todo, BusinessTodo, TodoPriority } from '@/api/todos.api';

type CombinedTodo = {
  id: string;
  title: string;
  dueDate?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'high' | 'medium' | 'low';
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
  high: 'bg-red-500',
  MEDIUM: 'bg-amber-500',
  medium: 'bg-amber-500',
  LOW: 'bg-blue-500',
  low: 'bg-blue-500',
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

export type { CombinedTodo };
```

**步骤2: 提交**

```bash
git add frontend/src/pages/auth/components/TodoList.tsx
git commit -m "feat(frontend): enhance TodoList with real data support"
```

---

### 任务 10: 改造 Notifications 组件

**文件：**
- 修改: `frontend/src/pages/auth/components/Notifications.tsx`

**步骤1: 重写 Notifications 组件接入真实API**

```tsx
import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Bell, BellOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Notification as ApiNotification, NotificationType } from '@/api/notifications.api';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface NotificationsProps {
  notifications: ApiNotification[];
  loading?: boolean;
  onViewAll?: () => void;
}

const typeConfig: Record<NotificationType, { icon: typeof CheckCircle2; bg: string; color: string }> = {
  [NotificationType.SUBMISSION_APPROVED]: { icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-600' },
  [NotificationType.SUBMISSION_REJECTED]: { icon: AlertTriangle, bg: 'bg-red-50', color: 'text-red-500' },
  [NotificationType.SUBMISSION_PENDING]: { icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600' },
  [NotificationType.CALCULATION_COMPLETE]: { icon: CheckCircle2, bg: 'bg-brand-primary/10', color: 'text-brand-primary' },
  [NotificationType.PERIOD_ACTIVATED]: { icon: Bell, bg: 'bg-purple-50', color: 'text-purple-600' },
  [NotificationType.PERIOD_LOCKED]: { icon: Clock, bg: 'bg-gray-50', color: 'text-gray-600' },
  [NotificationType.LOW_PERFORMANCE_ALERT]: { icon: AlertTriangle, bg: 'bg-orange-50', color: 'text-orange-600' },
  [NotificationType.ASSIGNMENT_CREATED]: { icon: Bell, bg: 'bg-cyan-50', color: 'text-cyan-600' },
  [NotificationType.SYSTEM_ANNOUNCEMENT]: { icon: Bell, bg: 'bg-indigo-50', color: 'text-indigo-600' },
};

const defaultConfig = { icon: Bell, bg: 'bg-slate-50', color: 'text-slate-600' };

export const Notifications: React.FC<NotificationsProps> = ({ notifications, loading, onViewAll }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 h-full">
        <div className="flex items-center justify-between mb-5">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-9 h-9 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-slate-800">最新通知</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary hover:opacity-80 font-medium transition-opacity"
          >
            查看全部
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <BellOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无新通知</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const config = typeConfig[notification.type] || defaultConfig;
            const Icon = config.icon;
            return (
              <div key={notification.id} className="flex gap-3">
                <div
                  className={`flex-shrink-0 w-9 h-9 ${config.bg} rounded-full flex items-center justify-center`}
                >
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {notification.content}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export type { NotificationsProps };
```

**步骤2: 提交**

```bash
git add frontend/src/pages/auth/components/Notifications.tsx
git commit -m "feat(frontend): enhance Notifications with real API data"
```

---

### 任务 11: 改造 WelcomeBanner 和 MonthlyPerformance 组件

**文件：**
- 修改: `frontend/src/pages/auth/components/WelcomeBanner.tsx`
- 修改: `frontend/src/pages/auth/components/MonthlyPerformance.tsx`

**步骤1: 更新 WelcomeBanner 字段语义**

修改 WelcomeStats 接口和显示文案:
- `activeKPIs` 改为 `pendingCount` (待处理数)
- 修正显示标签

```tsx
// WelcomeBanner.tsx - 修改统计卡片部分
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
    <p className="text-3xl font-bold">{stats.completionRate}%</p>
    <p className="text-brand-text-muted text-sm mt-1">整体完成率</p>
  </div>
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
    <p className="text-3xl font-bold">{stats.pendingCount}</p>
    <p className="text-brand-text-muted text-sm mt-1">待处理事项</p>
  </div>
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
    <p className="text-3xl font-bold">{stats.teamMembers}</p>
    <p className="text-brand-text-muted text-sm mt-1">团队成员</p>
  </div>
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
    <p className="text-3xl font-bold">{stats.riskCount}</p>
    <p className="text-brand-text-muted text-sm mt-1">风险预警</p>
  </div>
</div>
```

**步骤2: 更新 MonthlyPerformance 支持空状态**

```tsx
// MonthlyPerformance.tsx - 添加空状态处理
{metrics.length === 0 ? (
  <div className="text-center py-6 text-slate-400">
    <p>本周期暂无绩效数据</p>
  </div>
) : (
  <div className="space-y-4">
    {metrics.map((metric) => (
      // ... existing code
    ))}
  </div>
)}
```

**步骤3: 提交**

```bash
git add frontend/src/pages/auth/components/WelcomeBanner.tsx frontend/src/pages/auth/components/MonthlyPerformance.tsx
git commit -m "feat(frontend): improve WelcomeBanner and MonthlyPerformance"
```

---

### 任务 12: 重写 LandingPage 主组件

**文件：**
- 修改: `frontend/src/pages/auth/LandingPage.tsx`

**步骤1: 完整重写 LandingPage**

```tsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { assessmentApi } from '@/api/assessment.api';
import { reportsApi } from '@/api/reports.api';
import { notificationsApi, Notification as ApiNotification } from '@/api/notifications.api';
import { todosApi, Todo, BusinessTodo } from '@/api/todos.api';
import {
  WelcomeBanner,
  QuickNav,
  Notifications,
  TodoList,
  MonthlyPerformance,
  AddTodoDialog,
  type WelcomeStats,
  type PerformanceMetric,
} from './components';

interface OverviewData {
  periodName: string;
  totalEmployees: number;
  avgScore: number;
  excellent: number;
  good: number;
  average: number;
  poor: number;
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const notificationBtnRef = useRef<HTMLButtonElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [manualTodos, setManualTodos] = useState<Todo[]>([]);
  const [businessTodos, setBusinessTodos] = useState<BusinessTodo[]>([]);
  const [addTodoOpen, setAddTodoOpen] = useState(false);

  const isManager = ['GROUP_ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(user?.role || '');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [notifRes, manualRes, businessRes, periodsRes] = await Promise.all([
        notificationsApi.getNotifications({ limit: 5 }).catch(() => ({ data: [] })),
        todosApi.getAll({ completed: false, limit: 10 }).catch(() => ({ data: [] })),
        todosApi.getBusinessTodos().catch(() => []),
        assessmentApi.getPeriods().catch(() => ({ data: [] })),
      ]);

      setNotifications(notifRes.data || []);
      setManualTodos(manualRes.data || []);
      setBusinessTodos(businessRes || []);

      const periodsData = periodsRes.data || periodsRes || [];
      if (periodsData.length > 0) {
        const ov = await reportsApi.getOverview(periodsData[0].id).catch(() => null);
        setOverview(ov);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleTodo = async (id: string) => {
    try {
      await todosApi.toggle(id);
      setManualTodos((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // silent
    }
  };

  const handleViewAllNotifications = () => {
    const btn = document.querySelector('[data-notification-trigger]') as HTMLButtonElement;
    btn?.click();
  };

  const userName = user?.firstName || user?.username || '用户';

  const welcomeStats: WelcomeStats = useMemo(() => {
    const pendingCount = businessTodos.length + manualTodos.filter((t) => !t.completed).length;
    if (!overview) {
      return { completionRate: 0, pendingCount, teamMembers: 0, riskCount: 0 };
    }
    const total = overview.totalEmployees;
    const completed = overview.excellent + overview.good;
    return {
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      pendingCount,
      teamMembers: total,
      riskCount: overview.poor,
    };
  }, [overview, businessTodos, manualTodos]);

  const performanceMetrics: PerformanceMetric[] = useMemo(() => {
    if (!overview || overview.totalEmployees === 0) return [];
    const rate = Math.round(
      ((overview.excellent + overview.good) / overview.totalEmployees) * 100
    );
    return [{ id: '1', label: '目标达成率', value: rate, color: 'bg-brand-primary' }];
  }, [overview]);

  const ranking = useMemo(() => {
    if (!overview || overview.totalEmployees === 0) return undefined;
    const rate = Math.round(
      ((overview.excellent + overview.good) / overview.totalEmployees) * 100
    );
    if (rate >= 80) return { percentile: rate, message: `表现优秀！团队达成率${rate}%` };
    if (rate >= 60) return { percentile: rate, message: `表现良好，继续加油！` };
    return { percentile: rate, message: `需要关注，达成率${rate}%` };
  }, [overview]);

  const quickNavItems = useMemo(() => {
    const items = [
      { id: 'dashboard', title: '数据仪表盘', description: '查看详细的KPI数据分析和趋势图表', icon: 'dashboard' as const, path: '/app/dashboard' },
      { id: 'kpi', title: 'KPI管理', description: '创建、编辑和跟踪您的关键绩效指标', icon: 'kpi' as const, path: '/app/kpi-library' },
      { id: 'report', title: '报告中心', description: '生成和导出绩效报告文档', icon: 'report' as const, path: '/app/reports' },
    ];
    if (isManager) {
      items.splice(2, 0, { id: 'team', title: '团队协作', description: '管理团队成员和分配绩效目标', icon: 'team' as const, path: '/app/team' });
    }
    return items;
  }, [isManager]);

  return (
    <div className="space-y-6 pb-8">
      <WelcomeBanner
        userName={userName}
        stats={welcomeStats}
        onViewDashboard={() => navigate('/app/dashboard')}
      />

      <QuickNav items={quickNavItems} onNavigate={(path) => navigate(path)} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Notifications
            notifications={notifications}
            loading={loading}
            onViewAll={handleViewAllNotifications}
          />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <TodoList
            manualTodos={manualTodos}
            businessTodos={businessTodos}
            loading={loading}
            onAddTask={() => setAddTodoOpen(true)}
            onToggle={handleToggleTodo}
          />
          <MonthlyPerformance metrics={performanceMetrics} ranking={ranking} />
        </div>
      </div>

      <AddTodoDialog
        open={addTodoOpen}
        onOpenChange={setAddTodoOpen}
        onSuccess={loadData}
      />
    </div>
  );
};

export default LandingPage;
```

**步骤2: 更新 components/index.ts 导出**

确保导出所有需要的类型和组件。

**步骤3: 提交**

```bash
git add frontend/src/pages/auth/LandingPage.tsx frontend/src/pages/auth/components/index.ts
git commit -m "feat(frontend): complete LandingPage rewrite with real API integration"
```

---

### 任务 13: 更新类型定义和组件导出

**文件：**
- 修改: `frontend/src/pages/auth/components/index.ts`
- 修改: `frontend/src/pages/auth/components/WelcomeBanner.tsx`

**步骤1: 更新 WelcomeStats 类型**

```typescript
// WelcomeBanner.tsx
interface WelcomeStats {
  completionRate: number;
  pendingCount: number;
  teamMembers: number;
  riskCount: number;
}
```

**步骤2: 更新 index.ts 导出**

```typescript
export { WelcomeBanner, type WelcomeStats } from './WelcomeBanner';
export { QuickNav, type NavItem } from './QuickNav';
export { Notifications } from './Notifications';
export { TodoList } from './TodoList';
export { MonthlyPerformance, type PerformanceMetric } from './MonthlyPerformance';
export { AddTodoDialog } from './AddTodoDialog';
```

**步骤3: 提交**

```bash
git add frontend/src/pages/auth/components/
git commit -m "feat(frontend): update component exports and types"
```

---

### 任务 14: 验证和最终测试

**步骤1: 后端构建验证**

```bash
cd backend
npm run build
```

预期: 构建成功，无错误

**步骤2: 前端构建验证**

```bash
cd frontend
npm run build
```

预期: 构建成功，无错误

**步骤3: 类型检查**

```bash
cd frontend
npx tsc --noEmit
```

预期: 无类型错误

**步骤4: 最终提交**

```bash
git add .
git commit -m "feat: complete landing page optimization with todos system"
```
