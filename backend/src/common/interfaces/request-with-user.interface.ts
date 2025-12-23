import { UserRole } from '@prisma/client';

export interface RequestUser {
  userId: string;
  username: string;
  companyId: string;
  groupId: string; // 集团ID
  role: UserRole;
}

export interface RequestWithUser extends Request {
  user: RequestUser;
}
