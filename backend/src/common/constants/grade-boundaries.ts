import { KPIStatusEnum, PerformanceGrade } from '@prisma/client';

/** 统一的绩效等级边界配置 */
export const GRADE_BOUNDARIES = {
  S: 95, // 卓越
  A: 85, // 优秀
  B: 70, // 良好
  C: 60, // 待改进
} as const;

/** 统一的KPI状态边界配置 */
export const STATUS_BOUNDARIES = {
  EXCELLENT: 90,
  GOOD: 75,
  AVERAGE: 60,
} as const;

/** 根据分数判定绩效等级 (S/A/B/C/D) */
export function determinePerformanceGrade(score: number): PerformanceGrade {
  if (score >= GRADE_BOUNDARIES.S) return PerformanceGrade.S;
  if (score >= GRADE_BOUNDARIES.A) return PerformanceGrade.A;
  if (score >= GRADE_BOUNDARIES.B) return PerformanceGrade.B;
  if (score >= GRADE_BOUNDARIES.C) return PerformanceGrade.C;
  return PerformanceGrade.D;
}

/** 根据分数判定KPI状态 (EXCELLENT/GOOD/AVERAGE/POOR) */
export function determineKPIStatus(score: number): KPIStatusEnum {
  if (score >= STATUS_BOUNDARIES.EXCELLENT) return KPIStatusEnum.EXCELLENT;
  if (score >= STATUS_BOUNDARIES.GOOD) return KPIStatusEnum.GOOD;
  if (score >= STATUS_BOUNDARIES.AVERAGE) return KPIStatusEnum.AVERAGE;
  return KPIStatusEnum.POOR;
}

/** 根据分数判定等级（字符串形式，用于分布统计） */
export function getGradeFromScore(
  score: number,
  boundaries: Record<string, number> = GRADE_BOUNDARIES,
): string {
  if (score >= (boundaries.S ?? GRADE_BOUNDARIES.S)) return 'S';
  if (score >= (boundaries.A ?? GRADE_BOUNDARIES.A)) return 'A';
  if (score >= (boundaries.B ?? GRADE_BOUNDARIES.B)) return 'B';
  if (score >= (boundaries.C ?? GRADE_BOUNDARIES.C)) return 'C';
  return 'D';
}
