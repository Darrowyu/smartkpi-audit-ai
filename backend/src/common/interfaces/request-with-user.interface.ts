import { UserRole } from '@prisma/client';

export interface RequestUser {
  userId: string;
  username: string;
  companyId: string;
  groupId: string; // 集团ID
  role: UserRole;
  departmentId?: string | null; // 部门ID
  linkedEmployeeId?: string | null; // 关联员工ID
}

export interface RequestWithUser extends Request {
  user: RequestUser;
}
