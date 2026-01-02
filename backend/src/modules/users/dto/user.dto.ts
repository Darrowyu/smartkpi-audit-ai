import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsNumber,
  MaxLength,
  MinLength,
  Min,
  Max,
  Matches,
  ValidateIf,
} from 'class-validator';
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

  @IsOptional()
  @IsUUID()
  companyId?: string; // GROUP_ADMIN 可指定子公司
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string; // 前端可能发送但后端忽略

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string; // 修改密码

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
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @ValidateIf((o) => o.departmentId !== null)
  @IsUUID()
  departmentId?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.linkedEmployeeId !== null)
  @IsUUID()
  linkedEmployeeId?: string | null;
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

export class UpdateProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailNotify?: boolean;

  @IsOptional()
  @IsBoolean()
  pushNotify?: boolean;

  @IsOptional()
  @IsBoolean()
  smsNotify?: boolean;

  @IsOptional()
  @IsBoolean()
  kpiReminder?: boolean;

  @IsOptional()
  @IsBoolean()
  weeklyReport?: boolean;

  @IsOptional()
  @IsBoolean()
  teamUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  achievements?: boolean;

  @IsOptional()
  @IsBoolean()
  deadlineAlert?: boolean;
}

export class UpdateKpiPreferencesDto {
  @IsOptional()
  @IsString()
  defaultView?: 'month' | 'week' | 'year';

  @IsOptional()
  @IsString()
  reminderFrequency?: 'daily' | 'weekly' | 'monthly';

  @IsOptional()
  @IsBoolean()
  showProgressBar?: boolean;

  @IsOptional()
  @IsBoolean()
  showTrendChart?: boolean;

  @IsOptional()
  @IsBoolean()
  autoCalculate?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(100)
  warningThreshold?: number;

  @IsOptional()
  @IsString()
  selectedQuarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
}

export class UpdateAppearanceSettingsDto {
  @IsOptional()
  @IsString()
  theme?: 'light' | 'dark' | 'system';

  @IsOptional()
  @IsString()
  accentColor?: 'blue' | 'teal' | 'purple' | 'orange' | 'custom';

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'customColor must be a valid HEX color (e.g., #FF5733)',
  })
  customColor?: string;

  @IsOptional()
  @IsString()
  fontSize?: 'small' | 'medium' | 'large';

  @IsOptional()
  @IsBoolean()
  compactMode?: boolean;

  @IsOptional()
  @IsBoolean()
  animations?: boolean;
}

export class UpdateRegionalSettingsDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  dateFormat?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY年MM月DD日';

  @IsOptional()
  @IsString()
  timeFormat?: '24h' | '12h';
}
