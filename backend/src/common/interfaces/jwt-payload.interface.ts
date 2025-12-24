import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // 用户ID
  username: string;
  companyId: string;
  groupId: string; // 集团ID
  role: UserRole;
  departmentId?: string | null; // 部门ID
  linkedEmployeeId?: string | null; // 关联员工ID用于数据隔离
}
