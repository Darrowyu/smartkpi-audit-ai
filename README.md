# SmartKPI

企业级 KPI 绩效考核平台，集成 AI 智能分析能力。

## 技术栈

| 前端 | 后端 | 数据 |
|------|------|------|
| React 18 + TypeScript | NestJS 11 | PostgreSQL |
| Vite + TailwindCSS | Prisma ORM | Redis (可选) |
| Shadcn UI + Recharts | JWT + Passport | Gemini AI |

## 快速开始

```bash
# 安装依赖
npm run install:all

# 配置环境变量
cd backend && cp .env.example .env
# 编辑 .env 设置 DATABASE_URL 和 JWT_SECRET

# 初始化数据库
npx prisma generate && npx prisma migrate dev && npx prisma db seed

# 启动服务
cd .. && npm run dev
```

**访问地址:** 前端 http://localhost:5173 | 后端 http://localhost:3000/api  
**默认账号:** admin / admin123

## 系统架构

```
集团 (Group) → 公司 (Company) → 部门 (Department) → 员工 (Employee)
```

| 角色 | 权限范围 |
|------|----------|
| SUPER_ADMIN | 平台全局 |
| GROUP_ADMIN | 集团内跨公司 |
| MANAGER | 部门级 |
| USER | 个人数据 |

## 核心功能

- **KPI 管理** - 指标库定义、考核周期、指标分配、数据填报
- **智能计算** - 支持正向/反向/二元/阶梯/自定义公式
- **AI 分析** - Gemini 驱动的绩效诊断与建议
- **可视化报表** - 排名、趋势分析、PDF 导出

## 常用命令

```bash
npm run dev           # 启动开发环境
npm run build         # 生产构建
npx prisma studio     # 数据库管理
npx prisma migrate dev # 数据库迁移
```

## 环境变量

| 变量 | 必填 | 说明 |
|------|:----:|------|
| DATABASE_URL | ✓ | PostgreSQL 连接串 |
| JWT_SECRET | ✓ | JWT 密钥 (生产环境必改) |
| GEMINI_API_KEY | | AI 分析功能 |
| REDIS_HOST/PORT | | 队列服务 |

## License

MIT
