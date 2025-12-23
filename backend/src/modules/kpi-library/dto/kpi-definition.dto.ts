import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, Min, Max, IsObject } from 'class-validator';
import { FormulaType, AssessmentFrequency } from '@prisma/client';

export class CreateKPIDefinitionDto {
    @IsString()
    code: string; // 指标编码

    @IsString()
    name: string; // 指标名称

    @IsOptional()
    @IsString()
    description?: string; // 定义说明

    @IsOptional()
    @IsEnum(FormulaType)
    formulaType?: FormulaType; // 公式类型

    @IsOptional()
    @IsString()
    customFormula?: string; // 自定义 Math.js 公式

    @IsOptional()
    @IsEnum(AssessmentFrequency)
    frequency?: AssessmentFrequency; // 考核频率

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    defaultWeight?: number; // 默认权重

    @IsOptional()
    @IsNumber()
    scoreCap?: number; // 得分上限

    @IsOptional()
    @IsNumber()
    scoreFloor?: number; // 得分下限

    @IsOptional()
    @IsObject()
    scoringRules?: Record<string, any>; // 阶梯规则等

    @IsOptional()
    @IsString()
    sourceDepartment?: string; // 数据来源部门

    @IsOptional()
    @IsString()
    unit?: string; // 单位

    @IsOptional()
    @IsBoolean()
    isGlobal?: boolean; // 是否全局可用
}

export class UpdateKPIDefinitionDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(FormulaType)
    formulaType?: FormulaType;

    @IsOptional()
    @IsString()
    customFormula?: string;

    @IsOptional()
    @IsEnum(AssessmentFrequency)
    frequency?: AssessmentFrequency;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    defaultWeight?: number;

    @IsOptional()
    @IsNumber()
    scoreCap?: number;

    @IsOptional()
    @IsNumber()
    scoreFloor?: number;

    @IsOptional()
    @IsObject()
    scoringRules?: Record<string, any>;

    @IsOptional()
    @IsString()
    sourceDepartment?: string;

    @IsOptional()
    @IsString()
    unit?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class QueryKPIDefinitionDto {
    @IsOptional()
    @IsString()
    search?: string; // 搜索关键词

    @IsOptional()
    @IsEnum(FormulaType)
    formulaType?: FormulaType;

    @IsOptional()
    @IsEnum(AssessmentFrequency)
    frequency?: AssessmentFrequency;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsNumber()
    page?: number;

    @IsOptional()
    @IsNumber()
    limit?: number;
}
