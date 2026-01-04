# 首页(LandingPage)功能优化设计

> 创建日期: 2026-01-04

## 概述

优化首页功能，解决数据硬编码、功能缺失、API未接入等问题。

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

## 实现任务清单

### 后端
1. [ ] 新增 Todo 模型到 Prisma schema
2. [ ] 运行数据库迁移
3. [ ] 创建 todos 模块（controller/service/dto）
4. [ ] 实现手动待办 CRUD API
5. [ ] 实现业务待办聚合 API

### 前端
6. [ ] 创建 todos.api.ts
7. [ ] 改造 LandingPage 数据加载逻辑
8. [ ] 改造 Notifications 组件接入真实API
9. [ ] 改造 TodoList 组件（合并展示+功能实现）
10. [ ] 新增 AddTodoDialog 弹窗组件
11. [ ] 修复 WelcomeBanner 数据语义
12. [ ] 改造 MonthlyPerformance 接入真实数据
13. [ ] 实现权限区分逻辑
14. [ ] 添加加载状态和空状态UI
