import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

// 权限定义（与前端同步）
export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

// 角色权限映射
export interface RolePermissions {
  [role: string]: string[];
}

// 所有可用权限列表
const ALL_PERMISSIONS: Permission[] = [
  // KPI 指标库
  {
    id: 'kpi:view',
    name: '查看指标',
    description: '查看 KPI 指标库',
    module: 'kpi-library',
  },
  {
    id: 'kpi:create',
    name: '创建指标',
    description: '创建新的 KPI 指标',
    module: 'kpi-library',
  },
  {
    id: 'kpi:edit',
    name: '编辑指标',
    description: '修改现有 KPI 指标',
    module: 'kpi-library',
  },
  {
    id: 'kpi:delete',
    name: '删除指标',
    description: '删除 KPI 指标',
    module: 'kpi-library',
  },
  // 考核周期
  {
    id: 'period:view',
    name: '查看周期',
    description: '查看考核周期',
    module: 'assessment',
  },
  {
    id: 'period:create',
    name: '创建周期',
    description: '创建新的考核周期',
    module: 'assessment',
  },
  {
    id: 'period:lock',
    name: '锁定周期',
    description: '锁定考核周期',
    module: 'assessment',
  },
  // 数据填报
  {
    id: 'data:view',
    name: '查看数据',
    description: '查看填报数据',
    module: 'data-entry',
  },
  {
    id: 'data:submit',
    name: '提交数据',
    description: '提交填报数据',
    module: 'data-entry',
  },
  {
    id: 'data:approve',
    name: '审批数据',
    description: '审批填报数据',
    module: 'data-entry',
  },
  // 报表
  {
    id: 'report:view',
    name: '查看报表',
    description: '查看绩效报表',
    module: 'reports',
  },
  {
    id: 'report:export',
    name: '导出报表',
    description: '导出绩效数据',
    module: 'reports',
  },
  // 数据源
  {
    id: 'datasource:view',
    name: '查看数据源',
    description: '查看数据源配置',
    module: 'datasource',
  },
  {
    id: 'datasource:create',
    name: '创建数据源',
    description: '创建新的数据源',
    module: 'datasource',
  },
  {
    id: 'datasource:edit',
    name: '编辑数据源',
    description: '编辑数据源配置',
    module: 'datasource',
  },
  {
    id: 'datasource:delete',
    name: '删除数据源',
    description: '删除数据源',
    module: 'datasource',
  },
  // 用户管理
  {
    id: 'user:view',
    name: '查看用户',
    description: '查看用户列表',
    module: 'users',
  },
  {
    id: 'user:create',
    name: '创建用户',
    description: '创建新用户',
    module: 'users',
  },
  {
    id: 'user:edit',
    name: '编辑用户',
    description: '修改用户信息',
    module: 'users',
  },
  {
    id: 'user:delete',
    name: '删除用户',
    description: '删除用户',
    module: 'users',
  },
  // 系统设置
  {
    id: 'settings:view',
    name: '查看设置',
    description: '查看系统设置',
    module: 'settings',
  },
  {
    id: 'settings:edit',
    name: '修改设置',
    description: '修改系统设置',
    module: 'settings',
  },
];

// 默认角色权限（超级管理员不可修改）
const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  [UserRole.SUPER_ADMIN]: ALL_PERMISSIONS.map((p) => p.id),
  [UserRole.GROUP_ADMIN]: [
    'kpi:view',
    'kpi:create',
    'kpi:edit',
    'kpi:delete',
    'period:view',
    'period:create',
    'period:lock',
    'data:view',
    'data:submit',
    'data:approve',
    'report:view',
    'report:export',
    'datasource:view',
    'datasource:create',
    'datasource:edit',
    'datasource:delete',
    'user:view',
    'user:create',
    'user:edit',
    'settings:view',
  ],
  [UserRole.MANAGER]: [
    'kpi:view',
    'period:view',
    'data:view',
    'data:submit',
    'data:approve',
    'report:view',
    'report:export',
    'datasource:view',
    'datasource:create',
    'datasource:edit',
    'datasource:delete',
    'user:view',
  ],
  [UserRole.USER]: [
    'kpi:view',
    'period:view',
    'data:view',
    'data:submit',
    'report:view',
  ],
};

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /** 获取所有可用权限列表 */
  getAllPermissions(): Permission[] {
    return ALL_PERMISSIONS;
  }

  /** 获取公司的角色权限配置 */
  async getRolePermissions(companyId: string): Promise<RolePermissions> {
    const config = await this.prisma.permissionConfig.findUnique({
      where: { companyId },
    });

    if (!config) return { ...DEFAULT_ROLE_PERMISSIONS }; // 返回默认配置

    const stored = config.rolePermissions as RolePermissions;
    return {
      // 合并默认配置和自定义配置（SUPER_ADMIN 始终保持完整权限）
      ...stored,
      [UserRole.SUPER_ADMIN]: ALL_PERMISSIONS.map((p) => p.id),
    };
  }

  /** 保存公司的角色权限配置 */
  async saveRolePermissions(
    companyId: string,
    rolePermissions: RolePermissions,
    userId: string,
  ): Promise<void> {
    const data: any = {
      // 过滤掉 SUPER_ADMIN（不允许修改）
      ...rolePermissions,
      [UserRole.SUPER_ADMIN]: undefined,
    };
    delete data[UserRole.SUPER_ADMIN];

    await this.prisma.permissionConfig.upsert({
      where: { companyId },
      create: { companyId, rolePermissions: data, createdById: userId },
      update: { rolePermissions: data, updatedById: userId },
    });
  }

  /** 检查用户是否有特定权限 */
  async checkPermission(
    companyId: string,
    userRole: UserRole,
    permissionId: string,
  ): Promise<boolean> {
    if (userRole === UserRole.SUPER_ADMIN) return true; // 超管拥有所有权限

    const config = await this.getRolePermissions(companyId);
    const rolePerms = config[userRole] || [];
    return rolePerms.includes(permissionId);
  }

  /** 获取用户的所有权限 */
  async getUserPermissions(
    companyId: string,
    userRole: UserRole,
  ): Promise<string[]> {
    if (userRole === UserRole.SUPER_ADMIN)
      return ALL_PERMISSIONS.map((p) => p.id);

    const config = await this.getRolePermissions(companyId);
    return config[userRole] || [];
  }

  /** 重置为默认权限 */
  async resetToDefault(companyId: string): Promise<void> {
    await this.prisma.permissionConfig.deleteMany({
      where: { companyId },
    });
  }
}
