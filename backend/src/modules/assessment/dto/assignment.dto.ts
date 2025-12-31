import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
  ArrayMaxSize,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAssignmentDto {
  @IsUUID()
  kpiDefinitionId: string; // 指标ID

  @IsUUID()
  periodId: string; // 考核周期ID

  @IsOptional()
  @IsUUID()
  departmentId?: string; // 部门级分配（与employeeId互斥）

  @IsOptional()
  @IsUUID()
  employeeId?: string; // 个人级分配

  @IsNumber()
  @Min(0)
  targetValue: number; // 目标值

  @IsOptional()
  @IsNumber()
  @Min(0)
  challengeValue?: number; // 挑战值

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weight?: number; // 权重%，默认使用指标定义的默认权重
}

export class UpdateAssignmentDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  challengeValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weight?: number;
}

export class BulkAssignmentDto {
  @IsUUID()
  periodId: string;

  @IsArray()
  @ArrayMaxSize(500, { message: '单次最多分配500个指标，请分批操作' })
  @ValidateNested({ each: true })
  @Type(() => AssignmentItemDto)
  assignments: AssignmentItemDto[];
}

export class AssignmentItemDto {
  @IsUUID()
  kpiDefinitionId: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsNumber()
  @Min(0)
  targetValue: number;

  @IsOptional()
  @IsNumber()
  challengeValue?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;
}

export class QueryAssignmentDto {
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
