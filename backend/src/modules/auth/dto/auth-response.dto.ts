import { UserRole } from '@prisma/client';

export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    username: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    role: UserRole;
    companyId: string;
    language: string;
  };
}
