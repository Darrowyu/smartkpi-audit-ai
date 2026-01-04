import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum TodoPriorityEnum {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export class CreateTodoDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(TodoPriorityEnum)
  priority?: TodoPriorityEnum;

  @IsOptional()
  @IsString()
  relatedType?: string;

  @IsOptional()
  @IsUUID()
  relatedId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  reminderDays?: number;

  @IsOptional()
  @IsString()
  recurrence?: string;
}

export class UpdateTodoDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(TodoPriorityEnum)
  priority?: TodoPriorityEnum;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  completed?: boolean;

  @IsOptional()
  @IsString()
  relatedType?: string;

  @IsOptional()
  @IsUUID()
  relatedId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  reminderDays?: number;

  @IsOptional()
  @IsString()
  recurrence?: string;
}

export class QueryTodoDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  completed?: boolean;

  @IsOptional()
  @IsEnum(TodoPriorityEnum)
  priority?: TodoPriorityEnum;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
