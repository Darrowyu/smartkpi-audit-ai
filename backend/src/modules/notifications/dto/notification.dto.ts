import { IsString, IsOptional, IsEnum, IsBoolean, IsUUID, IsArray } from 'class-validator';

export enum NotificationTypeEnum {
  SUBMISSION_PENDING = 'SUBMISSION_PENDING',
  SUBMISSION_APPROVED = 'SUBMISSION_APPROVED',
  SUBMISSION_REJECTED = 'SUBMISSION_REJECTED',
  CALCULATION_COMPLETE = 'CALCULATION_COMPLETE',
  PERIOD_ACTIVATED = 'PERIOD_ACTIVATED',
  PERIOD_LOCKED = 'PERIOD_LOCKED',
  LOW_PERFORMANCE_ALERT = 'LOW_PERFORMANCE_ALERT',
  ASSIGNMENT_CREATED = 'ASSIGNMENT_CREATED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

export class CreateNotificationDto {
  @IsEnum(NotificationTypeEnum)
  type: NotificationTypeEnum;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  relatedType?: string;

  @IsOptional()
  @IsUUID()
  relatedId?: string;

  @IsUUID()
  userId: string;
}

export class QueryNotificationDto {
  @IsOptional()
  @IsEnum(NotificationTypeEnum)
  type?: NotificationTypeEnum;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class BulkNotificationDto {
  @IsEnum(NotificationTypeEnum)
  type: NotificationTypeEnum;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  relatedType?: string;

  @IsOptional()
  @IsUUID()
  relatedId?: string;

  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}
