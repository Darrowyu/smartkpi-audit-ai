# SmartKPI - 智能KPI考核系统

基于 AI 的员工绩效考核分析系统，支持 Excel 数据上传、Gemini AI 智能分析、可视化报表及 PDF 导出。

## 项目结构

```
├── frontend/          # 前端 React + Vite 应用
├── backend/           # 后端 NestJS API 服务
└── README.md          # 项目说明文档
```

## 技术栈

**前端:**
- React 18 + TypeScript
- Vite 5 构建工具
- TailwindCSS 样式框架
- Recharts 图表库
- @react-pdf/renderer PDF导出
- Axios HTTP客户端

**后端:**
- NestJS 11 + TypeScript
- Prisma ORM + PostgreSQL
- Passport + JWT 认证
- Google Gemini AI API

## 快速开始

### 方式一：一键启动（推荐）

```bash
# 首次运行：安装所有依赖
npm run install:all

# 配置后端环境变量
cd backend
cp .env.example .env
# 编辑 .env 填入数据库连接和 Gemini API 密钥

# 数据库迁移
npx prisma migrate dev
cd ..

# 一键启动前后端
npm run dev
```

### 方式二：分别启动

#### 1. 后端服务

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入数据库连接和 Gemini API 密钥

# 数据库迁移
npx prisma migrate dev

# 启动开发服务器
npm run start:dev
```

#### 2. 前端应用

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 访问应用

- 前端: http://localhost:5173
- 后端 API: http://localhost:3000/api
- 默认管理员账号: `admin` / `admin123`

## 主要功能

- ✅ 用户认证（JWT Token）
- ✅ 多租户数据隔离
- ✅ 公司管理（管理员）
- ✅ 用户管理（管理员）
- ✅ Excel 文件上传解析
- ✅ Gemini AI 智能 KPI 分析
- ✅ 可视化仪表盘
- ✅ PDF 报告导出
- ✅ 历史记录管理
- ✅ 中英文双语支持

## 可用脚本

在根目录下：

```bash
npm run dev              # 同时启动前后端开发服务器
npm run dev:backend      # 仅启动后端
npm run dev:frontend     # 仅启动前端
npm run build            # 构建前后端生产版本
npm run install:all      # 安装所有依赖（前端+后端）
```

## 许可证

MIT
