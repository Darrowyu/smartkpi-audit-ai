import { IsString, IsOptional, IsEmail, IsEnum, IsUUID, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username: string; // 用户名，用于登录

  @IsOptional()
  @IsEmail()
  email?: string; // 邮箱，可选

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string; // 部门ID（可选）
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string; // 允许修改邮箱

  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  departmentId?: string | null; // 部门ID（可选，null 表示移除部门）
}

export class UserQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  role?: string;
}
