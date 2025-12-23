import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string; // 部门代码如 SALES, ENG

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class DepartmentQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string; // 搜索名称或代码
}
