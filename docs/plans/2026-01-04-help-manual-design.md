# 使用手册功能 实施计划

**目标：** 实现内置使用手册功能，GitBook 风格的独立帮助中心页面

**架构：** 前端静态 Markdown 文档 + react-markdown 渲染 + 左侧目录树导航

**技术栈：** react-markdown, remark-gfm, Vite raw import

---

## 任务 1: 安装依赖

**文件：**
- 修改: `frontend/package.json`

**步骤1: 安装 react-markdown 和 remark-gfm**

```bash
cd frontend && npm install react-markdown remark-gfm
```

**步骤2: 验证安装**

```bash
npm list react-markdown remark-gfm
```

---

## 任务 2: 创建文档配置和内容

**文件：**
- 创建: `frontend/src/docs/index.ts`
- 创建: `frontend/src/docs/getting-started.md`
- 创建: `frontend/src/docs/kpi-management.md`
- 创建: `frontend/src/docs/data-entry.md`
- 创建: `frontend/src/docs/reports.md`
- 创建: `frontend/src/docs/assessment.md`
- 创建: `frontend/src/docs/team-management.md`
- 创建: `frontend/src/docs/permissions.md`
- 创建: `frontend/src/docs/system-settings.md`

**步骤1: 创建目录配置 index.ts**

```typescript
import gettingStarted from './getting-started.md?raw';
import kpiManagement from './kpi-management.md?raw';
import dataEntry from './data-entry.md?raw';
import reports from './reports.md?raw';
import assessment from './assessment.md?raw';
import teamManagement from './team-management.md?raw';
import permissions from './permissions.md?raw';
import systemSettings from './system-settings.md?raw';

export interface DocItem {
  id: string;
  title: string;
  icon: string;
  content: string;
}

export const docs: DocItem[] = [
  { id: 'getting-started', title: '快速入门', icon: 'Rocket', content: gettingStarted },
  { id: 'kpi-management', title: 'KPI管理', icon: 'Target', content: kpiManagement },
  { id: 'data-entry', title: '数据录入', icon: 'FileSpreadsheet', content: dataEntry },
  { id: 'reports', title: '报表查看', icon: 'FileText', content: reports },
  { id: 'assessment', title: '考核周期', icon: 'Calendar', content: assessment },
  { id: 'team-management', title: '团队管理', icon: 'Users', content: teamManagement },
  { id: 'permissions', title: '权限设置', icon: 'Shield', content: permissions },
  { id: 'system-settings', title: '系统设置', icon: 'Settings', content: systemSettings },
];

export const getDocById = (id: string): DocItem | undefined => docs.find(d => d.id === id);
```

**步骤2: 创建 8 篇 Markdown 文档（内容见附录）**

---

## 任务 3: 创建帮助中心页面组件

**文件：**
- 创建: `frontend/src/components/views/help/HelpCenterView.tsx`
- 修改: `frontend/src/components/views/index.ts`

**步骤1: 创建 HelpCenterView.tsx**

组件结构：
- 顶部搜索栏
- 左侧目录树 (240px)
- 右侧 Markdown 内容区
- 响应式：移动端目录下拉

---

## 任务 4: 创建页面入口和路由

**文件：**
- 创建: `frontend/src/pages/help/HelpPage.tsx`
- 修改: `frontend/src/router/index.tsx`

**步骤1: 创建 HelpPage.tsx**

```typescript
import React from 'react';
import { HelpCenterView } from '@/components/views/help/HelpCenterView';

const HelpPage: React.FC = () => <HelpCenterView />;
export default HelpPage;
```

**步骤2: 添加路由**

在 router/index.tsx 添加：
```typescript
const HelpPage = lazy(() => import('@/pages/help/HelpPage'));

// 在 /app children 中添加
{ path: 'help', element: <SuspenseWrapper><HelpPage /></SuspenseWrapper> },
{ path: 'help/:docId', element: <SuspenseWrapper><HelpPage /></SuspenseWrapper> },
```

---

## 任务 5: 修改 HelpTab 跳转逻辑

**文件：**
- 修改: `frontend/src/components/views/profile/tabs/HelpTab.tsx`

**步骤1: 导入 useNavigate 并修改按钮点击**

"使用手册"按钮点击后 `navigate('/app/help')`

---

## 任务 6: 构建验证

**步骤1: 运行类型检查**

```bash
cd frontend && npm run build
```

**步骤2: 启动开发服务器测试**

```bash
npm run dev
```

验证：访问 /app/help 页面正常显示
