import { Injectable } from '@nestjs/common';
import { evaluate, compile } from 'mathjs';
import { determineKPIStatus } from '../../../common/constants/grade-boundaries';

export enum FormulaType {
  POSITIVE = 'POSITIVE', // 正向指标：越大越好
  NEGATIVE = 'NEGATIVE', // 反向指标：越小越好
  BINARY = 'BINARY', // 二元指标：0/1
  STEPPED = 'STEPPED', // 阶梯指标：分段计分
  CUSTOM = 'CUSTOM', // 自定义公式
}

export interface ScoringRule {
  type: FormulaType;
  cap?: number; // 得分上限（如120）
  floor?: number; // 得分下限（如0）
  steps?: StepRule[]; // 阶梯规则
  customFormula?: string; // 自定义Math.js公式
}

export interface StepRule {
  threshold: number; // 阈值
  score: number; // 对应得分
  operator: 'gte' | 'gt' | 'lte' | 'lt' | 'eq'; // 比较运算符
}

export interface CalculationInput {
  actual: number; // 实际值
  target: number; // 目标值
  challenge?: number; // 挑战值
  weight: number; // 权重（%）
}

export interface CalculationResult {
  rawScore: number; // 原始得分
  weightedScore: number; // 加权得分
  cappedScore: number; // 封顶后得分
}

@Injectable()
export class FormulaEngine {
  /** 正向指标计算：(actual / target) * 100 */
  calculatePositive(
    input: CalculationInput,
    cap = 120,
    floor = 0,
  ): CalculationResult {
    const rawScore =
      input.target === 0 ? 0 : (input.actual / input.target) * 100;
    const cappedScore = Math.max(floor, Math.min(rawScore, cap));
    const weightedScore = cappedScore * (input.weight / 100);

    return { rawScore, cappedScore, weightedScore };
  }

  /** 反向指标计算：(target / actual) * 100（实际值越小越好） */
  calculateNegative(
    input: CalculationInput,
    cap = 120,
    floor = 0,
  ): CalculationResult {
    let rawScore: number;
    if (input.actual === 0) {
      rawScore = input.target === 0 ? 100 : cap; // 目标和实际都为0时得100分，否则得满分
    } else if (input.actual < 0) {
      rawScore = floor; // 实际值为负数时得最低分
    } else {
      rawScore = (input.target / input.actual) * 100;
    }
    const cappedScore = Math.max(floor, Math.min(rawScore, cap));
    const weightedScore = cappedScore * (input.weight / 100);

    return { rawScore, cappedScore, weightedScore };
  }

  /** 二元指标：发生即0分，未发生即满分 */
  calculateBinary(
    actual: number,
    weight: number,
    fullScore = 100,
  ): CalculationResult {
    const rawScore = actual === 0 ? fullScore : 0;
    const cappedScore = rawScore;
    const weightedScore = cappedScore * (weight / 100);

    return { rawScore, cappedScore, weightedScore };
  }

  /** 阶梯指标：根据阈值分段计分 */
  calculateStepped(
    actual: number,
    steps: StepRule[],
    weight: number,
  ): CalculationResult {
    let rawScore = 0;

    const sortedSteps = [...steps].sort((a, b) => b.threshold - a.threshold); // 从高到低排序

    for (const step of sortedSteps) {
      const match = this.evaluateStep(actual, step);
      if (match) {
        rawScore = step.score;
        break;
      }
    }

    const cappedScore = rawScore;
    const weightedScore = cappedScore * (weight / 100);

    return { rawScore, cappedScore, weightedScore };
  }

  /** 自定义公式计算 */
  calculateCustom(
    formula: string,
    scope: Record<string, number>,
    weight: number,
    cap = 120,
    floor = 0,
  ): CalculationResult {
    try {
      const rawScore = evaluate(formula, scope) as number;
      const cappedScore = Math.max(floor, Math.min(rawScore, cap));
      const weightedScore = cappedScore * (weight / 100);

      return { rawScore, cappedScore, weightedScore };
    } catch (error) {
      throw new Error(`公式计算错误: ${formula} - ${error}`);
    }
  }

  /** 验证公式语法 */
  validateFormula(formula: string): { valid: boolean; error?: string } {
    try {
      compile(formula);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  }

  /** 计算个人总分 */
  calculateTotalScore(results: CalculationResult[]): number {
    return results.reduce((sum, r) => sum + r.weightedScore, 0);
  }

  /** 根据总分判定绩效等级（使用统一边界配置） */
  determineStatus(
    totalScore: number,
  ): 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' {
    return determineKPIStatus(totalScore);
  }

  private evaluateStep(actual: number, step: StepRule): boolean {
    switch (step.operator) {
      case 'gte':
        return actual >= step.threshold;
      case 'gt':
        return actual > step.threshold;
      case 'lte':
        return actual <= step.threshold;
      case 'lt':
        return actual < step.threshold;
      case 'eq':
        return actual === step.threshold;
      default:
        return false;
    }
  }
}
