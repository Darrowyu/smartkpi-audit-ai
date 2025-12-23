# SmartKPI 后端服务

基于 NestJS 框架构建的后端 API 服务。

## 技术栈

- **框架**: NestJS 11 + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: Passport + JWT
- **AI**: Google Gemini API (@google/genai)

## 项目配置

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入数据库连接和 API 密钥

# 数据库迁移
npx prisma migrate dev

# 生成 Prisma 客户端
npx prisma generate

# 初始化种子数据（可选）
npm run db:seed
```

## 编译和运行

```bash
# 开发模式（热重载）
npm run start:dev

# 调试模式
npm run start:debug

# 生产模式
npm run build
npm run start:prod
```

## 运行测试

```bash
# 单元测试
npm run test

# 监听模式
npm run test:watch

# 端到端测试
npm run test:e2e

# 测试覆盖率
npm run test:cov
```

## API 模块

| 模块 | 路径 | 说明 |
|------|------|------|
| Auth | `/api/auth` | 用户认证（登录/注册/获取当前用户） |
| Users | `/api/users` | 用户管理（CRUD） |
| Files | `/api/files` | 文件上传/下载/删除 |
| KPI Analysis | `/api/kpi-analysis` | KPI 分析（触发分析/历史记录） |
| Departments | `/api/departments` | 部门管理 |
| Employees | `/api/employees` | 员工管理（含批量导入） |
| Company | `/api/company` | 公司信息及统计 |

## 目录结构

```
src/
├── common/                # 公共模块
│   ├── decorators/        # 自定义装饰器（CurrentUser, Roles）
│   ├── guards/            # 守卫（JWT认证, 角色, 租户）
│   ├── interceptors/      # 拦截器（租户上下文）
│   └── interfaces/        # 接口定义
├── modules/               # 业务模块
│   ├── auth/              # 认证模块
│   ├── users/             # 用户模块
│   ├── files/             # 文件模块
│   ├── kpi-analysis/      # KPI分析模块（含Gemini服务）
│   ├── departments/       # 部门模块
│   ├── employees/         # 员工模块
│   └── companies/         # 公司模块
├── prisma/                # Prisma 数据库服务
├── app.module.ts          # 应用主模块
└── main.ts                # 应用入口
```

## 环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://user:pass@localhost:5432/smartkpi` |
| `JWT_SECRET` | JWT 签名密钥 | 随机安全字符串 |
| `JWT_EXPIRATION` | JWT 过期时间 | `15m` |
| `GEMINI_API_KEY` | Google Gemini API 密钥 | 从 Google AI Studio 获取 |
| `UPLOAD_DIR` | 文件上传目录 | `./uploads` |
| `PORT` | 服务端口 | `3000` |
| `HTTPS_PROXY` | 代理地址（可选） | `http://127.0.0.1:7890` |

## 许可证

MIT
