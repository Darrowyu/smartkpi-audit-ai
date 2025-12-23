# SmartKPI - 智能KPI考核系统

基于 AI 的企业级员工绩效考核分析平台，支持多租户架构、Excel 数据上传、Gemini AI 智能分析、可视化报表及 PDF 导出。

## 项目结构

```
smartkpi-audit-ai/
├── frontend/          # 前端 React + Vite 应用
├── backend/           # 后端 NestJS API 服务
├── package.json       # 根目录工作区脚本
├── CLAUDE.md          # AI 开发指南
└── README.md          # 项目说明文档
```

## 环境要求

| 依赖 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 18.0.0 | 运行时环境 |
| PostgreSQL | >= 14 | 主数据库 |
| Redis | >= 6 | 队列服务（可选，用于异步任务） |
| npm | >= 9 | 包管理器 |

## 技术栈

**前端:**
- React 18 + TypeScript
- Vite 5 构建工具
- TailwindCSS + Shadcn UI (Radix)
- Recharts 图表库
- React Hook Form + Zod 表单验证
- @react-pdf/renderer PDF导出
- Axios HTTP客户端

**后端:**
- NestJS 11 + TypeScript
- Prisma 7 ORM + PostgreSQL
- Passport + JWT 认证
- Bull 队列 (Redis)
- Google Gemini AI API
- Math.js 公式计算引擎

## 快速开始

### 前置准备

1. **安装 PostgreSQL** 并创建数据库：
```sql
CREATE DATABASE smartkpi;
```

2. **安装 Redis**（可选，用于队列功能）：
```bash
# Windows: 使用 WSL 或 Docker
docker run -d -p 6379:6379 redis

# macOS
brew install redis && brew services start redis

# Linux
sudo apt install redis-server && sudo systemctl start redis
```

3. **获取 Gemini API Key**（可选，用于 AI 分析）：
   - 访问 https://makersuite.google.com/app/apikey
   - 创建 API Key

### 方式一：一键启动（推荐）

```bash
# 1. 克隆项目
git clone <repository-url>
cd smartkpi-audit-ai

# 2. 安装所有依赖
npm run install:all

# 3. 配置后端环境变量
cd backend
cp .env.example .env
```

编辑 `backend/.env` 文件：
```env
# 数据库连接（必填）
DATABASE_URL="postgresql://postgres:你的密码@localhost:5432/smartkpi?schema=public"

# JWT 密钥（生产环境必须修改）
JWT_SECRET="change-this-to-a-secure-random-string-in-production"

# Gemini API（可选，用于 AI 分析功能）
GEMINI_API_KEY="your-gemini-api-key-here"

# Redis（可选，用于队列功能）
REDIS_HOST="localhost"
REDIS_PORT=6379
```

```bash
# 4. 生成 Prisma 客户端
npx prisma generate

# 5. 运行数据库迁移
npx prisma migrate dev

# 6. 填充初始数据（可选）
npx prisma db seed

# 7. 返回根目录并启动
cd ..
npm run dev
```

### 方式二：分别启动

#### 1. 后端服务

```bash
cd backend
npm install
cp .env.example .env
# 编辑 .env 配置数据库等

npx prisma generate
npx prisma migrate dev
npx prisma db seed  # 可选：填充测试数据

npm run start:dev
```

#### 2. 前端应用

```bash
cd frontend
npm install
cp .env.example .env  # 通常无需修改

npm run dev
```

### 访问应用

| 服务 | 地址 |
|------|------|
| 前端应用 | http://localhost:5173 |
| 后端 API | http://localhost:3000/api |
| Prisma Studio | `npx prisma studio`（数据库管理） |

**默认账号：**
- 超级管理员: `admin` / `admin123`

## 多租户架构

系统采用四级层次结构：

```
Group (集团)
  └── Company (公司)
        └── Department (部门)
              └── Employee (员工)
```

**用户角色：**
| 角色 | 权限范围 |
|------|----------|
| SUPER_ADMIN | 平台级，跨集团 |
| GROUP_ADMIN | 集团级，跨公司 |
| MANAGER | 部门级 |
| USER | 个人数据 |

## 主要功能

### 基础功能
- ✅ 用户认证（JWT Token）
- ✅ 多租户数据隔离
- ✅ 公司/部门/用户管理
- ✅ 中英文双语支持

### KPI 考核流程
- ✅ **KPI 指标库** - 定义考核指标（支持5种公式类型）
- ✅ **考核周期管理** - 创建月度/季度/年度考核
- ✅ **指标分配** - 分配指标到部门/员工
- ✅ **数据填报** - 手动录入或 Excel 批量导入
- ✅ **得分计算** - 自动计算加权得分
- ✅ **绩效报表** - 排名、趋势、部门汇总

### AI 智能分析
- ✅ Excel 文件上传解析
- ✅ Gemini AI 智能 KPI 分析
- ✅ 绩效问题诊断与建议
- ✅ PDF 报告导出

### 高级功能
- ✅ 异步队列处理（大数据量导入）
- ✅ 通知系统
- ✅ 权限配置

## KPI 公式类型

| 类型 | 说明 | 示例 |
|------|------|------|
| POSITIVE | 正向指标，越大越好 | 销售额、产量 |
| NEGATIVE | 反向指标，越小越好 | 投诉率、缺陷率 |
| BINARY | 二元指标，0或1 | 是否完成认证 |
| STEPPED | 阶梯指标，分段计分 | 客户满意度等级 |
| CUSTOM | 自定义公式 | Math.js 表达式 |

## 可用脚本

### 根目录
```bash
npm run dev              # 同时启动前后端开发服务器
npm run dev:backend      # 仅启动后端
npm run dev:frontend     # 仅启动前端
npm run build            # 构建前后端生产版本
npm run install:all      # 安装所有依赖
```

### 后端 (`cd backend`)
```bash
npm run start:dev        # 开发模式（热重载）
npm run start:prod       # 生产模式
npm run build            # 构建
npm run lint             # ESLint 检查
npm run test             # 运行测试
npx prisma generate      # 生成 Prisma 客户端
npx prisma migrate dev   # 运行迁移
npx prisma db seed       # 填充数据
npx prisma studio        # 数据库管理界面
```

### 前端 (`cd frontend`)
```bash
npm run dev              # 开发服务器
npm run build            # 生产构建
npm run preview          # 预览构建结果
```

## API 概览

所有 API 以 `/api` 为前缀，需要 JWT 认证（除登录接口外）。

| 模块 | 端点 | 说明 |
|------|------|------|
| 认证 | `/api/auth/login` | 用户登录 |
| 用户 | `/api/users` | 用户 CRUD |
| 集团 | `/api/groups` | 集团管理 |
| 公司 | `/api/companies` | 公司管理 |
| 部门 | `/api/departments` | 部门管理 |
| 员工 | `/api/employees` | 员工管理 |
| 指标库 | `/api/kpi-library` | KPI 定义 |
| 考核周期 | `/api/assessment` | 周期管理 |
| 指标分配 | `/api/assignment` | 分配指标 |
| 数据提交 | `/api/calculation/submissions` | 数据填报 |
| 得分计算 | `/api/calculation/calculate` | 触发计算 |
| 报表 | `/api/reports` | 绩效报表 |
| 文件 | `/api/files` | 文件上传 |
| AI分析 | `/api/kpi-analysis` | Gemini 分析 |

## 故障排除

### 1. Prisma 客户端错误
```bash
# 错误: PrismaClient is not a constructor
# 解决: 重新生成客户端
cd backend && npx prisma generate
```

### 2. 数据库连接失败
```bash
# 错误: P1000: Authentication failed
# 检查:
# 1. PostgreSQL 服务是否运行
# 2. .env 中 DATABASE_URL 密码是否正确
# 3. 数据库 smartkpi 是否已创建
```

### 3. Redis 连接失败
```bash
# 如果不需要队列功能，可忽略 Redis 警告
# 或启动 Redis 服务:
docker run -d -p 6379:6379 redis
```

### 4. 端口被占用
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :5173
kill -9 <PID>
```

### 5. 文件名大小写问题（Windows）
```bash
# 错误: File name differs only in casing
# 解决: 检查 import 路径大小写是否与实际文件名一致
```

## 环境变量说明

### 后端 (`backend/.env`)

| 变量 | 必填 | 说明 |
|------|------|------|
| DATABASE_URL | ✅ | PostgreSQL 连接字符串 |
| JWT_SECRET | ✅ | JWT 签名密钥（生产环境必须修改） |
| JWT_EXPIRATION | | Token 过期时间，默认 15m |
| GEMINI_API_KEY | | Google Gemini API 密钥 |
| REDIS_HOST | | Redis 主机，默认 localhost |
| REDIS_PORT | | Redis 端口，默认 6379 |
| PORT | | 服务端口，默认 3000 |
| CORS_ORIGIN | | 允许的前端地址 |

### 前端 (`frontend/.env`)

| 变量 | 说明 |
|------|------|
| VITE_API_URL | 后端 API 地址，默认 http://localhost:3000 |
| VITE_API_BASE_URL | API 路径前缀，默认 /api |

## 许可证

MIT
