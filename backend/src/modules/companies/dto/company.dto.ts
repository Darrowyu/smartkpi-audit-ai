import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MaxLength(100)
  name: string; // 子公司名称

  @IsOptional()
  @IsString()
  @MaxLength(100)
  domain?: string; // 域名

  @IsOptional()
  settings?: Record<string, any>; // 公司设置
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  domain?: string;

  @IsOptional()
  settings?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CompanyQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string; // 搜索公司名称或域名
}
