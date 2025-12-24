import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubmissionStatus } from '@prisma/client';

export class CreateSubmissionDto {
  @IsUUID()
  periodId: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string; // 部门级提交

  @IsOptional()
  @IsString()
  dataSource?: string; // "excel" | "manual"
}

export class UpdateSubmissionDto {
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @IsOptional()
  @IsString()
  rejectReason?: string;
}

export class DataEntryDto {
  @IsUUID()
  assignmentId: string; // 指标分配ID

  @IsUUID()
  employeeId: string; // 员工ID

  @IsNumber()
  actualValue: number; // 实际完成值

  @IsOptional()
  @IsString()
  remark?: string;
}

export class BulkDataEntryDto {
  @IsUUID()
  submissionId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DataEntryDto)
  entries: DataEntryDto[];
}
