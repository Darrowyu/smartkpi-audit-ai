# KPI指标库全面优化 实施计划

**目标：** 完善KPI指标库模块，修复功能缺失、代码质量问题，并添加优化功能

**架构：** 后端优化批量导入事务和统计API，前端完善表单验证、分页、导入导出功能

**技术栈：** NestJS, Prisma, React, TypeScript, xlsx, zod

---

## 任务概览

| 序号 | 任务 | 优先级 |
|------|------|--------|
| 1 | 后端: 批量导入改用事务 | 高 |
| 2 | 后端: 补充真实统计API | 高 |
| 3 | 前端: 补充findOne API方法 | 中 |
| 4 | 前端: 添加STEPPED类型选项 | 高 |
| 5 | 前端: customFormula条件校验 | 高 |
| 6 | 前端: 添加分页组件 | 中 |
| 7 | 前端: 修复假数据统计 | 高 |
| 8 | 前端: 实现导出功能 | 中 |
| 9 | 前端: 实现导入功能 | 中 |
| 10 | 验证与测试 | 高 |

---

### 任务 1: 后端批量导入改用事务

**文件：**
- 修改: `backend/src/modules/kpi-library/kpi-library.service.ts`

**步骤1: 修改bulkCreate方法使用事务**

将循环单条插入改为 `$transaction` + `createMany`，提高性能和数据一致性：

```typescript
/** 批量导入指标 */
async bulkCreate(definitions: CreateKPIDefinitionDto[], companyId: string) {
  if (definitions.length > 500) {
    throw new BadRequestException('单次最多导入500个指标，请分批导入');
  }

  // 预验证所有公式
  for (const dto of definitions) {
    if (dto.customFormula) {
      const validation = this.formulaEngine.validateFormula(dto.customFormula);
      if (!validation.valid) {
        throw new BadRequestException(`指标 ${dto.code} 公式语法错误: ${validation.error}`);
      }
    }
  }

  // 检查编码重复
  const codes = definitions.map(d => d.code);
  const existing = await this.prisma.kPIDefinition.findMany({
    where: { companyId, code: { in: codes } },
    select: { code: true },
  });

  if (existing.length > 0) {
    const duplicates = existing.map(e => e.code).join(', ');
    throw new ConflictException(`以下指标编码已存在: ${duplicates}`);
  }

  // 使用事务批量创建
  const result = await this.prisma.kPIDefinition.createMany({
    data: definitions.map(dto => ({ ...dto, companyId })),
    skipDuplicates: true,
  });

  return { success: result.count, failed: 0, errors: [] };
}
```

---

### 任务 2: 后端补充真实统计API

**文件：**
- 修改: `backend/src/modules/kpi-library/kpi-library.service.ts`
- 修改: `backend/src/modules/kpi-library/kpi-library.controller.ts`

**步骤1: 扩展getStatistics方法返回完整统计**

```typescript
/** 获取指标完整统计 */
async getStatistics(companyId: string, groupId?: string) {
  const where = {
    OR: [
      { companyId },
      { isGlobal: true },
      ...(groupId ? [{ groupId }] : []),
    ],
  };

  const [total, active, byType, byFrequency] = await Promise.all([
    this.prisma.kPIDefinition.count({ where }),
    this.prisma.kPIDefinition.count({ where: { ...where, isActive: true } }),
    this.prisma.kPIDefinition.groupBy({
      by: ['formulaType'],
      where: { ...where, isActive: true },
      _count: true,
    }),
    this.prisma.kPIDefinition.groupBy({
      by: ['frequency'],
      where: { ...where, isActive: true },
      _count: true,
    }),
  ]);

  return {
    total,
    active,
    inactive: total - active,
    byType: byType.reduce((acc, s) => ({ ...acc, [s.formulaType]: s._count }), {}),
    byFrequency: byFrequency.reduce((acc, s) => ({ ...acc, [s.frequency]: s._count }), {}),
  };
}
```

**步骤2: 更新Controller传递groupId**

```typescript
@Get('statistics')
@Roles(UserRole.MANAGER, UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
async getStatistics(@Request() req: any) {
  return this.kpiLibraryService.getStatistics(req.user.companyId, req.user.groupId);
}
```

---

### 任务 3: 前端补充findOne和getStatistics API

**文件：**
- 修改: `frontend/src/api/kpi-library.api.ts`

**步骤1: 添加缺失的API方法**

```typescript
import { apiClient } from './client';
import { KPIDefinition, QueryKPIDefinitionDto } from '../types';

export interface KPILibraryStats {
    total: number;
    active: number;
    inactive: number;
    byType: Record<string, number>;
    byFrequency: Record<string, number>;
}

export const kpiLibraryApi = {
    findAll: async (query: QueryKPIDefinitionDto) => {
        const response = await apiClient.get('/kpi-library', { params: query });
        return response.data;
    },

    findOne: async (id: string): Promise<KPIDefinition> => {
        const response = await apiClient.get(`/kpi-library/${id}`);
        return response.data;
    },

    getStatistics: async (): Promise<KPILibraryStats> => {
        const response = await apiClient.get('/kpi-library/statistics');
        return response.data;
    },

    create: async (data: Partial<KPIDefinition>) => {
        const response = await apiClient.post('/kpi-library', data);
        return response.data;
    },

    update: async (id: string, data: Partial<KPIDefinition>) => {
        const response = await apiClient.put(`/kpi-library/${id}`, data);
        return response.data;
    },

    remove: async (id: string) => {
        const response = await apiClient.delete(`/kpi-library/${id}`);
        return response.data;
    },

    bulkCreate: async (definitions: Partial<KPIDefinition>[]) => {
        const response = await apiClient.post('/kpi-library/bulk', definitions);
        return response.data;
    },
};
```

---

### 任务 4-9: 前端KPILibraryView全面优化

**文件：**
- 修改: `frontend/src/components/views/kpi-library/KPILibraryView.tsx`

**优化内容：**
1. 添加STEPPED类型选项
2. customFormula条件校验 (CUSTOM类型时必填)
3. 添加分页组件
4. 使用真实统计数据
5. 实现Excel导出功能
6. 实现Excel导入功能

**完整修改代码见下方实现步骤**

---

### 任务 10: 验证

**验证命令：**
```bash
cd backend && npm run build
cd frontend && npm run build
```

**手动测试点：**
1. 创建新指标 - 选择STEPPED类型
2. 选择CUSTOM类型 - 验证customFormula必填
3. 测试分页 - 创建超过20条数据
4. 测试导出 - 下载Excel文件
5. 测试导入 - 上传Excel文件

---

## 执行顺序

1. 后端修改 (任务1-2)
2. 前端API (任务3)
3. 前端视图 (任务4-9)
4. 验证 (任务10)
