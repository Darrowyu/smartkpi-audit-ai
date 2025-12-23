import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // 用户ID
  username: string;
  companyId: string;
  groupId: string; // 集团ID
  role: UserRole;
}
