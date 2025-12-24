import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { PeriodStatus } from '@prisma/client';

export class CreatePeriodDto {
  @IsString()
  name: string; // 周期名称，如"2024年Q1"

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsDateString()
  lockDate?: string; // 锁定日期
}

export class UpdatePeriodDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  lockDate?: string;

  @IsOptional()
  @IsEnum(PeriodStatus)
  status?: PeriodStatus;
}

export class QueryPeriodDto {
  @IsOptional()
  @IsEnum(PeriodStatus)
  status?: PeriodStatus;

  @IsOptional()
  @IsString()
  year?: string; // 按年份筛选

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
