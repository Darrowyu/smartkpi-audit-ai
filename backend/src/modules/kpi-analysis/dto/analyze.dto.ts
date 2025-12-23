import { IsOptional, IsString, IsIn } from 'class-validator';

export class AnalyzeDto {
  @IsOptional()
  @IsString()
  @IsIn(['en', 'zh'])
  language?: string; // 分析结果语言

  @IsOptional()
  @IsString()
  period?: string; // 用户指定的考核周期
}

export class AnalysisQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  period?: string; // 按期间筛选
}
