# KPI系统功能增强实施计划

**目标：** 实现P0-P2优先级的12个功能模块，将系统升级为企业级专业KPI管理平台

**架构：** 采用NestJS后端模块化架构 + React前端组件化设计，Prisma ORM管理数据模型，TDD驱动开发

**技术栈：** NestJS 11, Prisma 7, PostgreSQL, React 18, TypeScript, TailwindCSS, Recharts

---

## 目录

- [P0-1: 多级审批工作流](#p0-1-多级审批工作流)
- [P0-2: 绩效校准盘](#p0-2-绩效校准盘)
- [P0-3: 强制分布配置](#p0-3-强制分布配置)
- [P0-4: 面谈记录功能](#p0-4-面谈记录功能)
- [P1-1: 人才九宫格](#p1-1-人才九宫格)
- [P1-2: 目标对齐可视化](#p1-2-目标对齐可视化)
- [P1-3: 薪酬系数对接](#p1-3-薪酬系数对接)
- [P1-4: 过程检查点](#p1-4-过程检查点)
- [P2-1: 系统数据自动接入](#p2-1-系统数据自动接入)
- [P2-2: 实时进度热力图](#p2-2-实时进度热力图)
- [P2-3: 阶梯计分规则UI](#p2-3-阶梯计分规则ui)
- [P2-4: 个人历史趋势图](#p2-4-个人历史趋势图)

---

## P0-1: 多级审批工作流

### 任务 1.1: 扩展数据库Schema

**文件：**
- 修改: `backend/prisma/schema.prisma`

**步骤1: 添加审批流程相关枚举和模型**

```prisma
// 添加到 schema.prisma

enum ApprovalStage {
  SELF_EVAL       // 自评
  MANAGER_REVIEW  // 主管评分
  SKIP_LEVEL      // 隔级审批
  HR_CONFIRM      // HR确认
  COMPLETED       // 完成
}

enum ApprovalAction {
  SUBMIT          // 提交
  APPROVE         // 通过
  REJECT          // 驳回
  RETURN          // 退回修改
}

// 审批流程配置
model ApprovalWorkflow {
  id          String   @id @default(uuid())
  name        String   // 流程名称
  companyId   String   @map("company_id")
  
  // 流程配置JSON: [{ stage: "SELF_EVAL", required: true, approverRole: "USER" }, ...]
  stages      Json     
  
  isDefault   Boolean  @default(false) @map("is_default")
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  periods     AssessmentPeriod[] @relation("PeriodWorkflow")
  
  @@unique([companyId, name])
  @@index([companyId])
  @@map("approval_workflows")
}

// 审批实例
model ApprovalInstance {
  id              String         @id @default(uuid())
  
  periodId        String         @map("period_id")
  employeeId      String         @map("employee_id")
  
  currentStage    ApprovalStage  @default(SELF_EVAL) @map("current_stage")
  
  // 各阶段数据快照
  selfEvalData    Json?          @map("self_eval_data")
  managerData     Json?          @map("manager_data")
  skipLevelData   Json?          @map("skip_level_data")
  hrData          Json?          @map("hr_data")
  
  // 最终得分
  finalScore      Float?         @map("final_score")
  
  companyId       String         @map("company_id")
  
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  completedAt     DateTime?      @map("completed_at")
  
  // Relations
  logs            ApprovalLog[]
  
  @@unique([periodId, employeeId])
  @@index([periodId])
  @@index([employeeId])
  @@index([currentStage])
  @@map("approval_instances")
}

// 审批日志
model ApprovalLog {
  id              String         @id @default(uuid())
  
  instanceId      String         @map("instance_id")
  instance        ApprovalInstance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  
  stage           ApprovalStage
  action          ApprovalAction
  
  operatorId      String         @map("operator_id")
  operatorName    String         @map("operator_name")
  operatorRole    String         @map("operator_role")
  
  comment         String?        @db.Text
  data            Json?          // 本次操作的数据快照
  
  createdAt       DateTime       @default(now())
  
  @@index([instanceId])
  @@index([operatorId])
  @@map("approval_logs")
}
```

**步骤2: 修改AssessmentPeriod添加工作流关联**

```prisma
// 修改 AssessmentPeriod 模型
model AssessmentPeriod {
  // ... 现有字段 ...
  
  workflowId   String?          @map("workflow_id")
  workflow     ApprovalWorkflow? @relation("PeriodWorkflow", fields: [workflowId], references: [id])
  
  // Relations
  // ... 现有关系 ...
  approvalInstances ApprovalInstance[]
}
```

**步骤3: 运行迁移**

```bash
cd backend
npx prisma migrate dev --name add_approval_workflow
```

**步骤4: 提交**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(db): add approval workflow models"
```

---

### 任务 1.2: 创建审批工作流后端模块

**文件：**
- 创建: `backend/src/modules/approval/approval.module.ts`
- 创建: `backend/src/modules/approval/approval.service.ts`
- 创建: `backend/src/modules/approval/approval.controller.ts`
- 创建: `backend/src/modules/approval/dto/`
- 测试: `backend/src/modules/approval/approval.service.spec.ts`

**步骤1: 创建DTO**

```typescript
// backend/src/modules/approval/dto/create-workflow.dto.ts
import { IsString, IsArray, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkflowStageDto {
  @IsString()
  stage: string; // ApprovalStage enum value

  @IsBoolean()
  required: boolean;

  @IsString()
  approverRole: string; // UserRole enum value
}

export class CreateWorkflowDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStageDto)
  stages: WorkflowStageDto[];

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

// backend/src/modules/approval/dto/submit-approval.dto.ts
export class SubmitApprovalDto {
  @IsString()
  periodId: string;

  @IsString()
  @IsOptional()
  comment?: string;

  data?: Record<string, any>; // 评分数据
}

// backend/src/modules/approval/dto/process-approval.dto.ts
export class ProcessApprovalDto {
  @IsString()
  instanceId: string;

  @IsString()
  action: string; // ApprovalAction

  @IsString()
  @IsOptional()
  comment?: string;

  data?: Record<string, any>;
}
```

**步骤2: 创建Service**

```typescript
// backend/src/modules/approval/approval.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ApprovalStage, ApprovalAction, UserRole } from '@prisma/client';
import { CreateWorkflowDto, SubmitApprovalDto, ProcessApprovalDto } from './dto';

@Injectable()
export class ApprovalService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // 创建工作流配置
  async createWorkflow(companyId: string, dto: CreateWorkflowDto) {
    return this.prisma.approvalWorkflow.create({
      data: { ...dto, companyId, stages: dto.stages },
    });
  }

  // 获取公司工作流列表
  async getWorkflows(companyId: string) {
    return this.prisma.approvalWorkflow.findMany({
      where: { companyId, isActive: true },
    });
  }

  // 获取默认工作流
  async getDefaultWorkflow(companyId: string) {
    return this.prisma.approvalWorkflow.findFirst({
      where: { companyId, isDefault: true, isActive: true },
    });
  }

  // 发起审批（员工自评提交）
  async initiateApproval(userId: string, companyId: string, dto: SubmitApprovalDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { linkedEmployee: true },
    });

    if (!user?.linkedEmployeeId) {
      throw new BadRequestException('用户未关联员工');
    }

    // 检查是否已存在审批实例
    const existing = await this.prisma.approvalInstance.findUnique({
      where: { periodId_employeeId: { periodId: dto.periodId, employeeId: user.linkedEmployeeId } },
    });

    if (existing) {
      throw new BadRequestException('该周期已存在审批实例');
    }

    // 创建审批实例
    const instance = await this.prisma.approvalInstance.create({
      data: {
        periodId: dto.periodId,
        employeeId: user.linkedEmployeeId,
        companyId,
        currentStage: ApprovalStage.MANAGER_REVIEW, // 自评完成，进入主管评审
        selfEvalData: dto.data,
      },
    });

    // 记录日志
    await this.createLog(instance.id, ApprovalStage.SELF_EVAL, ApprovalAction.SUBMIT, user, dto.comment, dto.data);

    // 通知主管
    await this.notifyNextApprover(instance.id, ApprovalStage.MANAGER_REVIEW);

    return instance;
  }

  // 处理审批
  async processApproval(userId: string, dto: ProcessApprovalDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const instance = await this.prisma.approvalInstance.findUnique({
      where: { id: dto.instanceId },
    });

    if (!instance) throw new NotFoundException('审批实例不存在');

    const action = dto.action as ApprovalAction;
    const currentStage = instance.currentStage;

    // 验证操作权限
    await this.validateApprovalPermission(user, instance);

    let nextStage = currentStage;
    let updateData: any = {};

    if (action === ApprovalAction.APPROVE) {
      // 保存当前阶段数据
      updateData = this.getStageUpdateData(currentStage, dto.data);
      nextStage = this.getNextStage(currentStage);
      
      if (nextStage === ApprovalStage.COMPLETED) {
        updateData.completedAt = new Date();
        updateData.finalScore = this.calculateFinalScore(instance, dto.data);
      }
    } else if (action === ApprovalAction.REJECT) {
      nextStage = ApprovalStage.SELF_EVAL; // 退回自评
    } else if (action === ApprovalAction.RETURN) {
      nextStage = this.getPreviousStage(currentStage);
    }

    // 更新实例
    const updated = await this.prisma.approvalInstance.update({
      where: { id: dto.instanceId },
      data: { ...updateData, currentStage: nextStage },
    });

    // 记录日志
    await this.createLog(dto.instanceId, currentStage, action, user, dto.comment, dto.data);

    // 通知下一个审批人
    if (nextStage !== ApprovalStage.COMPLETED) {
      await this.notifyNextApprover(dto.instanceId, nextStage);
    }

    return updated;
  }

  // 获取待审批列表
  async getPendingApprovals(userId: string, companyId: string, stage?: ApprovalStage) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const where: any = { companyId };

    // 根据用户角色过滤
    if (user.role === UserRole.USER) {
      where.employeeId = user.linkedEmployeeId;
      where.currentStage = ApprovalStage.SELF_EVAL;
    } else if (user.role === UserRole.MANAGER) {
      where.currentStage = ApprovalStage.MANAGER_REVIEW;
      // TODO: 添加部门过滤
    } else if (stage) {
      where.currentStage = stage;
    }

    return this.prisma.approvalInstance.findMany({
      where,
      include: {
        logs: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // 获取审批详情
  async getApprovalDetail(instanceId: string) {
    return this.prisma.approvalInstance.findUnique({
      where: { id: instanceId },
      include: {
        logs: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  // 私有方法
  private async createLog(instanceId: string, stage: ApprovalStage, action: ApprovalAction, user: any, comment?: string, data?: any) {
    return this.prisma.approvalLog.create({
      data: {
        instanceId, stage, action,
        operatorId: user.id,
        operatorName: user.username,
        operatorRole: user.role,
        comment, data,
      },
    });
  }

  private getNextStage(current: ApprovalStage): ApprovalStage {
    const order = [ApprovalStage.SELF_EVAL, ApprovalStage.MANAGER_REVIEW, ApprovalStage.SKIP_LEVEL, ApprovalStage.HR_CONFIRM, ApprovalStage.COMPLETED];
    const idx = order.indexOf(current);
    return order[Math.min(idx + 1, order.length - 1)];
  }

  private getPreviousStage(current: ApprovalStage): ApprovalStage {
    const order = [ApprovalStage.SELF_EVAL, ApprovalStage.MANAGER_REVIEW, ApprovalStage.SKIP_LEVEL, ApprovalStage.HR_CONFIRM];
    const idx = order.indexOf(current);
    return order[Math.max(idx - 1, 0)];
  }

  private getStageUpdateData(stage: ApprovalStage, data: any) {
    const mapping = {
      [ApprovalStage.MANAGER_REVIEW]: { managerData: data },
      [ApprovalStage.SKIP_LEVEL]: { skipLevelData: data },
      [ApprovalStage.HR_CONFIRM]: { hrData: data },
    };
    return mapping[stage] || {};
  }

  private calculateFinalScore(instance: any, hrData: any): number {
    // 综合各阶段评分计算最终得分
    return hrData?.finalScore || instance.selfEvalData?.score || 0;
  }

  private async validateApprovalPermission(user: any, instance: any) {
    // 验证用户是否有权限审批当前阶段
    const stageRoleMapping = {
      [ApprovalStage.SELF_EVAL]: [UserRole.USER],
      [ApprovalStage.MANAGER_REVIEW]: [UserRole.MANAGER, UserRole.GROUP_ADMIN],
      [ApprovalStage.SKIP_LEVEL]: [UserRole.GROUP_ADMIN],
      [ApprovalStage.HR_CONFIRM]: [UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN],
    };

    const allowedRoles = stageRoleMapping[instance.currentStage] || [];
    if (!allowedRoles.includes(user.role)) {
      throw new BadRequestException('无权限审批当前阶段');
    }
  }

  private async notifyNextApprover(instanceId: string, stage: ApprovalStage) {
    // 发送通知给下一个审批人
    // TODO: 实现具体通知逻辑
  }
}
```

**步骤3: 创建Controller**

```typescript
// backend/src/modules/approval/approval.controller.ts
import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApprovalService } from './approval.service';
import { CreateWorkflowDto, SubmitApprovalDto, ProcessApprovalDto } from './dto';

@Controller('approval')
@UseGuards(JwtAuthGuard)
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Post('workflows')
  createWorkflow(@Request() req, @Body() dto: CreateWorkflowDto) {
    return this.approvalService.createWorkflow(req.user.companyId, dto);
  }

  @Get('workflows')
  getWorkflows(@Request() req) {
    return this.approvalService.getWorkflows(req.user.companyId);
  }

  @Post('submit')
  submitApproval(@Request() req, @Body() dto: SubmitApprovalDto) {
    return this.approvalService.initiateApproval(req.user.id, req.user.companyId, dto);
  }

  @Post('process')
  processApproval(@Request() req, @Body() dto: ProcessApprovalDto) {
    return this.approvalService.processApproval(req.user.id, dto);
  }

  @Get('pending')
  getPendingApprovals(@Request() req, @Query('stage') stage?: string) {
    return this.approvalService.getPendingApprovals(req.user.id, req.user.companyId, stage as any);
  }

  @Get(':id')
  getApprovalDetail(@Param('id') id: string) {
    return this.approvalService.getApprovalDetail(id);
  }
}
```

**步骤4: 创建Module**

```typescript
// backend/src/modules/approval/approval.module.ts
import { Module } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApprovalController } from './approval.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ApprovalController],
  providers: [ApprovalService],
  exports: [ApprovalService],
})
export class ApprovalModule {}
```

**步骤5: 注册模块到AppModule**

```typescript
// 修改 backend/src/app.module.ts
import { ApprovalModule } from './modules/approval/approval.module';

@Module({
  imports: [
    // ... 现有模块 ...
    ApprovalModule,
  ],
})
export class AppModule {}
```

**步骤6: 提交**

```bash
git add backend/src/modules/approval/
git commit -m "feat(approval): add multi-level approval workflow backend"
```

---

### 任务 1.3: 创建前端审批流程页面

**文件：**
- 创建: `frontend/src/api/approval.api.ts`
- 创建: `frontend/src/components/views/approval/ApprovalWorkflowView.tsx`
- 修改: `frontend/src/types.ts`
- 修改: `frontend/src/App.tsx`
- 修改: `frontend/src/components/layout/Sidebar.tsx`

**步骤1: 添加类型定义**

```typescript
// 添加到 frontend/src/types.ts

export enum ApprovalStage {
  SELF_EVAL = 'SELF_EVAL',
  MANAGER_REVIEW = 'MANAGER_REVIEW',
  SKIP_LEVEL = 'SKIP_LEVEL',
  HR_CONFIRM = 'HR_CONFIRM',
  COMPLETED = 'COMPLETED',
}

export enum ApprovalAction {
  SUBMIT = 'SUBMIT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  RETURN = 'RETURN',
}

export interface ApprovalInstance {
  id: string;
  periodId: string;
  employeeId: string;
  currentStage: ApprovalStage;
  selfEvalData?: any;
  managerData?: any;
  skipLevelData?: any;
  hrData?: any;
  finalScore?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  logs?: ApprovalLog[];
}

export interface ApprovalLog {
  id: string;
  stage: ApprovalStage;
  action: ApprovalAction;
  operatorName: string;
  operatorRole: string;
  comment?: string;
  createdAt: string;
}

// 添加到 View 类型
export type View = 
  | /* ... 现有 ... */
  | 'approval-workflow';
```

**步骤2: 创建API客户端**

```typescript
// frontend/src/api/approval.api.ts
import { apiClient } from './client';
import { ApprovalInstance, ApprovalStage } from '@/types';

export const approvalApi = {
  // 获取待审批列表
  getPending: async (stage?: ApprovalStage): Promise<ApprovalInstance[]> => {
    const params = stage ? { stage } : {};
    const res = await apiClient.get('/approval/pending', { params });
    return res.data;
  },

  // 获取审批详情
  getDetail: async (id: string): Promise<ApprovalInstance> => {
    const res = await apiClient.get(`/approval/${id}`);
    return res.data;
  },

  // 提交自评
  submit: async (periodId: string, data: any, comment?: string) => {
    const res = await apiClient.post('/approval/submit', { periodId, data, comment });
    return res.data;
  },

  // 处理审批
  process: async (instanceId: string, action: string, data?: any, comment?: string) => {
    const res = await apiClient.post('/approval/process', { instanceId, action, data, comment });
    return res.data;
  },

  // 获取工作流配置
  getWorkflows: async () => {
    const res = await apiClient.get('/approval/workflows');
    return res.data;
  },
};
```

**步骤3: 创建审批工作流视图组件** (简化版，完整代码约500行)

```typescript
// frontend/src/components/views/approval/ApprovalWorkflowView.tsx
import React, { useEffect, useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Clock, XCircle, Send, ArrowRight, User, Users, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { approvalApi } from '@/api/approval.api';
import { ApprovalInstance, ApprovalStage, ApprovalAction } from '@/types';
import { cn } from '@/lib/utils';

const STAGE_CONFIG = {
  [ApprovalStage.SELF_EVAL]: { label: '自评', icon: User, color: 'text-blue-600' },
  [ApprovalStage.MANAGER_REVIEW]: { label: '主管评审', icon: Users, color: 'text-purple-600' },
  [ApprovalStage.SKIP_LEVEL]: { label: '隔级审批', icon: Shield, color: 'text-amber-600' },
  [ApprovalStage.HR_CONFIRM]: { label: 'HR确认', icon: CheckCircle, color: 'text-emerald-600' },
  [ApprovalStage.COMPLETED]: { label: '已完成', icon: CheckCircle, color: 'text-green-600' },
};

// 审批流程进度条组件
const ApprovalProgress: React.FC<{ currentStage: ApprovalStage }> = ({ currentStage }) => {
  const stages = [ApprovalStage.SELF_EVAL, ApprovalStage.MANAGER_REVIEW, ApprovalStage.SKIP_LEVEL, ApprovalStage.HR_CONFIRM];
  const currentIdx = stages.indexOf(currentStage);

  return (
    <div className="flex items-center justify-between mb-6">
      {stages.map((stage, idx) => {
        const config = STAGE_CONFIG[stage];
        const Icon = config.icon;
        const isCompleted = idx < currentIdx || currentStage === ApprovalStage.COMPLETED;
        const isCurrent = idx === currentIdx;

        return (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center border-2',
                isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                isCurrent ? 'bg-blue-500 border-blue-500 text-white' :
                'bg-slate-100 border-slate-300 text-slate-400'
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn('text-xs mt-1', isCurrent ? 'font-medium text-blue-600' : 'text-slate-500')}>
                {config.label}
              </span>
            </div>
            {idx < stages.length - 1 && (
              <ArrowRight className={cn('w-5 h-5 mx-2', isCompleted ? 'text-emerald-500' : 'text-slate-300')} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const ApprovalWorkflowView: React.FC = memo(() => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [instances, setInstances] = useState<ApprovalInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstance, setSelectedInstance] = useState<ApprovalInstance | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<ApprovalAction | null>(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadInstances = useCallback(async () => {
    setLoading(true);
    try {
      const data = await approvalApi.getPending();
      setInstances(data);
    } catch {
      toast({ variant: 'destructive', title: '加载失败' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadInstances(); }, [loadInstances]);

  const handleAction = async () => {
    if (!selectedInstance || !actionType) return;
    setProcessing(true);
    try {
      await approvalApi.process(selectedInstance.id, actionType, {}, comment);
      toast({ title: '操作成功' });
      setActionDialogOpen(false);
      setComment('');
      loadInstances();
    } catch {
      toast({ variant: 'destructive', title: '操作失败' });
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (instance: ApprovalInstance, action: ApprovalAction) => {
    setSelectedInstance(instance);
    setActionType(action);
    setActionDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">审批工作流</h1>
        <p className="text-slate-500">管理绩效评估的多级审批流程</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">待处理</TabsTrigger>
          <TabsTrigger value="completed">已完成</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {loading ? (
            <div className="text-center py-12 text-slate-500">加载中...</div>
          ) : instances.length === 0 ? (
            <div className="text-center py-12 text-slate-500">暂无待处理审批</div>
          ) : (
            instances.map(instance => (
              <Card key={instance.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">员工: {instance.employeeId}</CardTitle>
                    <Badge>{STAGE_CONFIG[instance.currentStage]?.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ApprovalProgress currentStage={instance.currentStage} />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => openActionDialog(instance, ApprovalAction.RETURN)}>
                      退回修改
                    </Button>
                    <Button variant="destructive" onClick={() => openActionDialog(instance, ApprovalAction.REJECT)}>
                      驳回
                    </Button>
                    <Button onClick={() => openActionDialog(instance, ApprovalAction.APPROVE)}>
                      通过
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="completed">
          <div className="text-center py-12 text-slate-500">已完成审批列表</div>
        </TabsContent>
      </Tabs>

      {/* 操作确认对话框 */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === ApprovalAction.APPROVE ? '确认通过' :
               actionType === ApprovalAction.REJECT ? '确认驳回' : '确认退回'}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="请输入审批意见（可选）..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>取消</Button>
            <Button onClick={handleAction} disabled={processing}>
              {processing ? '处理中...' : '确认'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

ApprovalWorkflowView.displayName = 'ApprovalWorkflowView';
```

**步骤4: 更新路由和导航**

```typescript
// 修改 frontend/src/App.tsx - 添加路由
import { ApprovalWorkflowView } from '@/components/views/approval/ApprovalWorkflowView';

// 在routes中添加
{ path: '/approval', element: <ApprovalWorkflowView /> }

// 修改 frontend/src/components/layout/Sidebar.tsx - 添加菜单项
{ icon: GitBranch, label: '审批工作流', path: '/approval', roles: ['MANAGER', 'GROUP_ADMIN', 'SUPER_ADMIN'] }
```

**步骤5: 提交**

```bash
git add frontend/src/
git commit -m "feat(approval): add approval workflow frontend"
```

---

## P0-2: 绩效校准盘

### 任务 2.1: 添加校准相关数据模型

**文件：**
- 修改: `backend/prisma/schema.prisma`

**步骤1: 添加校准会话模型**

```prisma
// 添加到 schema.prisma

// 校准会话
model CalibrationSession {
  id          String   @id @default(uuid())
  name        String   // 会话名称，如"2024Q4销售部门校准"
  
  periodId    String   @map("period_id")
  companyId   String   @map("company_id")
  
  // 参与部门
  departmentIds Json   @map("department_ids") // string[]
  
  // 原始分数范围统计
  originalStats Json?  @map("original_stats")
  // 校准后分数统计
  calibratedStats Json? @map("calibrated_stats")
  
  status      String   @default("draft") // draft | in_progress | completed
  
  createdById String   @map("created_by_id")
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  completedAt DateTime? @map("completed_at")
  
  // Relations
  adjustments CalibrationAdjustment[]
  
  @@index([periodId])
  @@index([companyId])
  @@map("calibration_sessions")
}

// 校准调整记录
model CalibrationAdjustment {
  id          String   @id @default(uuid())
  
  sessionId   String   @map("session_id")
  session     CalibrationSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  employeeId  String   @map("employee_id")
  
  originalScore  Float  @map("original_score")
  adjustedScore  Float  @map("adjusted_score")
  
  reason      String?  @db.Text
  adjustedById String  @map("adjusted_by_id")
  
  createdAt   DateTime @default(now())
  
  @@index([sessionId])
  @@index([employeeId])
  @@map("calibration_adjustments")
}
```

**步骤2: 运行迁移**

```bash
cd backend
npx prisma migrate dev --name add_calibration_session
```

**步骤3: 提交**

```bash
git add backend/prisma/
git commit -m "feat(db): add calibration session models"
```

---

### 任务 2.2: 创建校准服务

**文件：**
- 创建: `backend/src/modules/calibration/calibration.module.ts`
- 创建: `backend/src/modules/calibration/calibration.service.ts`
- 创建: `backend/src/modules/calibration/calibration.controller.ts`

**步骤1: 创建Service**

```typescript
// backend/src/modules/calibration/calibration.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CalibrationSessionService {
  constructor(private prisma: PrismaService) {}

  // 创建校准会话
  async createSession(companyId: string, userId: string, data: {
    name: string;
    periodId: string;
    departmentIds: string[];
  }) {
    // 获取原始分数统计
    const performances = await this.prisma.employeePerformance.findMany({
      where: { periodId: data.periodId, departmentId: { in: data.departmentIds } },
    });

    const originalStats = this.calculateStats(performances.map(p => p.totalScore));

    return this.prisma.calibrationSession.create({
      data: {
        ...data,
        companyId,
        createdById: userId,
        departmentIds: data.departmentIds,
        originalStats,
        status: 'draft',
      },
    });
  }

  // 获取会话详情（含员工分数）
  async getSessionDetail(sessionId: string) {
    const session = await this.prisma.calibrationSession.findUnique({
      where: { id: sessionId },
      include: { adjustments: true },
    });

    if (!session) throw new NotFoundException('会话不存在');

    // 获取所有相关员工绩效
    const departmentIds = session.departmentIds as string[];
    const performances = await this.prisma.employeePerformance.findMany({
      where: { periodId: session.periodId, departmentId: { in: departmentIds } },
    });

    // 合并调整数据
    const adjustmentMap = new Map(session.adjustments.map(a => [a.employeeId, a]));
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: performances.map(p => p.employeeId) } },
      include: { department: true },
    });

    const data = performances.map(p => {
      const emp = employees.find(e => e.id === p.employeeId);
      const adj = adjustmentMap.get(p.employeeId);
      return {
        employeeId: p.employeeId,
        employeeName: emp?.name || 'Unknown',
        departmentName: emp?.department?.name || 'Unknown',
        originalScore: p.totalScore,
        adjustedScore: adj?.adjustedScore ?? p.totalScore,
        isAdjusted: !!adj,
        reason: adj?.reason,
      };
    });

    return { session, employees: data };
  }

  // 调整分数
  async adjustScore(sessionId: string, userId: string, employeeId: string, adjustedScore: number, reason?: string) {
    const session = await this.prisma.calibrationSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('会话不存在');

    // 获取原始分数
    const performance = await this.prisma.employeePerformance.findFirst({
      where: { periodId: session.periodId, employeeId },
    });

    return this.prisma.calibrationAdjustment.upsert({
      where: { sessionId_employeeId: { sessionId, employeeId } },
      create: {
        sessionId,
        employeeId,
        originalScore: performance?.totalScore || 0,
        adjustedScore,
        reason,
        adjustedById: userId,
      },
      update: { adjustedScore, reason, adjustedById: userId },
    });
  }

  // 完成校准并应用
  async completeSession(sessionId: string) {
    const session = await this.prisma.calibrationSession.findUnique({
      where: { id: sessionId },
      include: { adjustments: true },
    });

    if (!session) throw new NotFoundException('会话不存在');

    // 应用所有调整到 EmployeePerformance
    for (const adj of session.adjustments) {
      await this.prisma.employeePerformance.updateMany({
        where: { periodId: session.periodId, employeeId: adj.employeeId },
        data: { totalScore: adj.adjustedScore },
      });
    }

    // 更新统计
    const performances = await this.prisma.employeePerformance.findMany({
      where: { periodId: session.periodId, departmentId: { in: session.departmentIds as string[] } },
    });
    const calibratedStats = this.calculateStats(performances.map(p => p.totalScore));

    return this.prisma.calibrationSession.update({
      where: { id: sessionId },
      data: { status: 'completed', calibratedStats, completedAt: new Date() },
    });
  }

  private calculateStats(scores: number[]) {
    if (scores.length === 0) return { avg: 0, min: 0, max: 0, stdDev: 0 };
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
    return {
      avg: Math.round(avg * 100) / 100,
      min: Math.min(...scores),
      max: Math.max(...scores),
      stdDev: Math.round(Math.sqrt(variance) * 100) / 100,
      count: scores.length,
    };
  }
}
```

**步骤2: 创建Controller和Module** (类似结构，略)

**步骤3: 提交**

```bash
git add backend/src/modules/calibration/
git commit -m "feat(calibration): add calibration session backend"
```

---

### 任务 2.3: 创建校准盘前端组件

**文件：**
- 创建: `frontend/src/components/views/calibration/CalibrationView.tsx`
- 创建: `frontend/src/api/calibration.api.ts`

**步骤1: 创建校准盘可视化组件** (核心：拖拽调整分数的散点图)

```typescript
// frontend/src/components/views/calibration/CalibrationView.tsx
// 使用Recharts的ScatterChart实现可交互的校准盘
// 支持拖拽调整分数、查看部门分布、批量调整
// 约600行代码，此处省略完整实现
```

**步骤2: 提交**

```bash
git add frontend/src/components/views/calibration/
git commit -m "feat(calibration): add calibration panel frontend"
```

---

## P0-3: 强制分布配置

### 任务 3.1: 添加强制分布模型

**文件：**
- 修改: `backend/prisma/schema.prisma`

```prisma
// 强制分布配置
model DistributionConfig {
  id          String   @id @default(uuid())
  
  companyId   String   @map("company_id")
  periodId    String?  @map("period_id") // null表示默认配置
  
  // 分布规则 JSON: { "S": 10, "A": 20, "B": 40, "C": 20, "D": 10 }
  distribution Json
  
  // 是否强制执行
  isEnforced  Boolean  @default(false) @map("is_enforced")
  
  // 允许的偏差百分比
  tolerance   Float    @default(5)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([companyId, periodId])
  @@map("distribution_configs")
}
```

---

## P0-4: 面谈记录功能

### 任务 4.1: 添加面谈记录模型

```prisma
// 面谈记录
model PerformanceInterview {
  id          String   @id @default(uuid())
  
  periodId    String   @map("period_id")
  employeeId  String   @map("employee_id")
  
  interviewerId String @map("interviewer_id")
  interviewerName String @map("interviewer_name")
  
  scheduledAt DateTime @map("scheduled_at")
  conductedAt DateTime? @map("conducted_at")
  
  // 面谈内容
  summary     String?  @db.Text // 面谈摘要
  strengths   String?  @db.Text // 优势
  improvements String? @db.Text // 改进点
  goals       String?  @db.Text // 下期目标
  employeeFeedback String? @db.Text @map("employee_feedback") // 员工反馈
  
  // 员工签字确认
  employeeConfirmed Boolean @default(false) @map("employee_confirmed")
  employeeConfirmedAt DateTime? @map("employee_confirmed_at")
  
  companyId   String   @map("company_id")
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([periodId, employeeId])
  @@index([periodId])
  @@index([interviewerId])
  @@map("performance_interviews")
}
```

---

## P1-1: 人才九宫格

### 任务 5.1: 添加潜力评估模型

```prisma
// 潜力评估
model PotentialAssessment {
  id          String   @id @default(uuid())
  
  employeeId  String   @map("employee_id")
  periodId    String   @map("period_id")
  
  // 潜力维度评分 (1-5)
  learningAgility    Int @map("learning_agility")    // 学习敏捷度
  leadershipPotential Int @map("leadership_potential") // 领导潜力
  technicalDepth     Int @map("technical_depth")     // 技术深度
  collaborationSkill Int @map("collaboration_skill") // 协作能力
  
  // 综合潜力分 (自动计算)
  potentialScore     Float @map("potential_score")
  
  assessorId  String   @map("assessor_id")
  
  createdAt   DateTime @default(now())
  
  @@unique([employeeId, periodId])
  @@map("potential_assessments")
}
```

### 任务 5.2: 创建九宫格前端组件

```typescript
// frontend/src/components/views/talent/NineBoxGridView.tsx
// 使用Recharts ScatterChart，X轴为绩效，Y轴为潜力
// 9个区域分别标注：明星、核心骨干、潜力股、熟练工...
```

---

## P1-2: 目标对齐可视化

### 任务 6.1: 添加目标层级关系模型

```prisma
// 目标层级关系
model GoalAlignment {
  id          String   @id @default(uuid())
  
  childKpiId  String   @map("child_kpi_id")   // 子目标
  parentKpiId String   @map("parent_kpi_id")  // 父目标
  
  // 贡献权重
  contributionWeight Float @default(100) @map("contribution_weight")
  
  periodId    String   @map("period_id")
  companyId   String   @map("company_id")
  
  createdAt   DateTime @default(now())
  
  @@unique([childKpiId, parentKpiId, periodId])
  @@map("goal_alignments")
}
```

### 任务 6.2: 创建目标树形可视化组件

```typescript
// 使用D3.js或react-flow实现可交互的目标树形图
// 展示公司目标→部门目标→个人目标的层级关系
```

---

## P1-3: 薪酬系数对接

### 任务 7.1: 添加薪酬系数配置

```prisma
// 薪酬系数配置
model SalaryCoefficient {
  id          String   @id @default(uuid())
  
  companyId   String   @map("company_id")
  
  // 等级对应系数 JSON: { "S": 1.5, "A": 1.2, "B": 1.0, "C": 0.8, "D": 0.5 }
  coefficients Json
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([companyId])
  @@map("salary_coefficients")
}

// 员工薪酬计算结果
model SalaryCalculation {
  id          String   @id @default(uuid())
  
  periodId    String   @map("period_id")
  employeeId  String   @map("employee_id")
  
  performanceScore Float @map("performance_score")
  performanceGrade String @map("performance_grade") // S/A/B/C/D
  coefficient     Float
  
  baseSalary      Float?  @map("base_salary")
  bonusAmount     Float?  @map("bonus_amount")
  
  createdAt   DateTime @default(now())
  
  @@unique([periodId, employeeId])
  @@map("salary_calculations")
}
```

---

## P1-4: 过程检查点(Check-ins)

### 任务 8.1: 添加检查点模型

```prisma
// 进度检查点
model ProgressCheckIn {
  id          String   @id @default(uuid())
  
  assignmentId String  @map("assignment_id") // 关联的KPI分配
  employeeId  String   @map("employee_id")
  
  checkInDate DateTime @map("check_in_date")
  
  // 进度数据
  currentValue Float   @map("current_value")
  progressPercent Float @map("progress_percent")
  
  // 说明和附件
  notes       String?  @db.Text
  attachments Json?    // 附件URL列表
  
  // 风险标记
  riskLevel   String   @default("normal") @map("risk_level") // normal | warning | critical
  
  createdAt   DateTime @default(now())
  
  @@index([assignmentId])
  @@index([employeeId])
  @@index([checkInDate])
  @@map("progress_check_ins")
}
```

---

## P2-1: 系统数据自动接入

### 任务 9.1: 添加数据源配置

```prisma
// 外部数据源配置
model DataSourceConfig {
  id          String   @id @default(uuid())
  
  companyId   String   @map("company_id")
  name        String   // 数据源名称
  
  type        String   // erp | crm | hr | custom_api
  
  // 连接配置 (加密存储)
  connectionConfig Json @map("connection_config")
  
  // 字段映射
  fieldMapping Json    @map("field_mapping")
  
  // 同步配置
  syncFrequency String @default("daily") @map("sync_frequency") // hourly | daily | weekly
  lastSyncAt   DateTime? @map("last_sync_at")
  
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("data_source_configs")
}
```

---

## P2-2: 实时进度热力图

### 任务 10.1: 创建热力图组件

```typescript
// frontend/src/components/views/dashboard/ProgressHeatmap.tsx
// 使用Recharts或自定义Canvas实现
// 行：员工/部门，列：KPI指标
// 单元格颜色：绿(>100%) 黄(80-100%) 红(<80%)
```

---

## P2-3: 阶梯计分规则UI

### 任务 11.1: 增强KPI指标库表单

```typescript
// 在KPILibraryView的表单中添加阶梯规则配置
// 支持可视化配置分段规则：
// [0, 60) → 0分
// [60, 80) → 线性插值 60-80分
// [80, 100) → 线性插值 80-100分
// [100, ∞) → 100 + (actual-100)*0.5 封顶120
```

---

## P2-4: 个人历史趋势图

### 任务 12.1: 创建个人绩效历史API

```typescript
// backend/src/modules/reports/reports.service.ts
async getEmployeeHistory(employeeId: string, periodCount: number = 8) {
  return this.prisma.employeePerformance.findMany({
    where: { employeeId },
    orderBy: { period: { startDate: 'desc' } },
    take: periodCount,
    include: { period: true },
  });
}
```

### 任务 12.2: 创建趋势图组件

```typescript
// frontend/src/components/views/profile/PerformanceHistoryChart.tsx
// 使用Recharts LineChart展示个人历史绩效曲线
// 支持对比公司/部门平均值
```

---

## 执行顺序建议

1. **批次1 (数据库层)**: 执行所有Schema修改，一次性迁移
2. **批次2 (P0后端)**: 审批工作流、校准、强制分布、面谈 - 后端API
3. **批次3 (P0前端)**: 对应的前端页面
4. **批次4 (P1后端)**: 九宫格、目标对齐、薪酬、检查点 - 后端
5. **批次5 (P1前端)**: 对应前端
6. **批次6 (P2)**: 数据接入、热力图、阶梯UI、历史趋势

---

**计划文件保存位置:** `docs/plans/2025-12-26-kpi-system-enhancement.md`
