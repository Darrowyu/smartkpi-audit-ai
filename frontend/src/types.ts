export enum KPIStatus {
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  AVERAGE = 'Average',
  POOR = 'Poor'
}

export type Language = 'en' | 'zh';
export type View =
  | 'landing'
  | 'dashboard'
  | 'kpi-management'
  | 'team-management'
  | 'reports'
  | 'history'
  | 'settings'
  | 'upload'
  | 'organization'
  | 'company'
  | 'kpi-library'
  | 'assessment'
  | 'data-entry'
  | 'permissions'
  | 'assignment'
  | 'group-dashboard';

// 用户角色
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  GROUP_ADMIN = 'GROUP_ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER'
}

// 集团
export interface Group {
  id: string;
  name: string;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// 部门
export interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// 认证用户
export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  companyId: string;
  groupId?: string; // 集团ID
  language?: string;
  isActive: boolean;
}

export interface KPIMetric {
  name: string;
  weight: number;
  targetValue: string | number;
  actualValue: string | number;
  score: number;
  comment: string;
}

export interface EmployeeKPI {
  id: string;
  name: string;
  department: string;
  role: string;
  totalScore: number;
  status: KPIStatus;
  metrics: KPIMetric[];
  aiAnalysis: string;
}

export interface KPIAnalysisResult {
  summary: string;
  period: string;
  employees: EmployeeKPI[];
}

export interface UploadState {
  isUploading: boolean;
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  fileName: string;
  result: KPIAnalysisResult;
}

// KPI管理相关类型
// [已废弃] 旧 KPI 定义接口被新版 KPIDefinition 替代
// export interface KPIDefinition { ... }

// 团队成员类型
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

// 统计数据类型
export interface DashboardStats {
  totalRevenue: number;
  activeProjects: number;
  teamSize: number;
  avgPerformance: number;
  revenueChange?: string;
  projectsChange?: string;
  teamChange?: string;
  performanceChange?: string;
}
// NEW: KPI System Types
export enum FormulaType {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
  BINARY = 'BINARY',
  STEPPED = 'STEPPED',
  CUSTOM = 'CUSTOM',
}

export enum AssessmentFrequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export interface KPIDefinition {
  id: string;
  code: string;
  name: string;
  description?: string;
  formulaType: FormulaType;
  customFormula?: string;
  frequency: AssessmentFrequency;
  defaultWeight: number;
  scoreCap: number;
  scoreFloor: number;
  sourceDepartment?: string;
  unit?: string;
  isGlobal?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QueryKPIDefinitionDto {
  search?: string;
  formulaType?: FormulaType;
  frequency?: AssessmentFrequency;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export enum PeriodStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  ARCHIVED = 'ARCHIVED',
}

export interface AssessmentPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  companyId: string;
}

export interface KPIAssignment {
  id: string;
  kpiDefinition: KPIDefinition;
  targetValue: number;
  weight: number;
}
