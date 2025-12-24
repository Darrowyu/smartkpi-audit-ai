import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  name: string; // 集团名称

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>; // 集团设置
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class GroupQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string; // 搜索集团名称
}
