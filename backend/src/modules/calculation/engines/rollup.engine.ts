import { Injectable } from '@nestjs/common';

export enum RollupMethod {
  AVERAGE = 'AVERAGE', // 全员平均分
  WEIGHTED_AVERAGE = 'WEIGHTED_AVERAGE', // 加权平均
  LEADER_SCORE = 'LEADER_SCORE', // 部门负责人得分
  SUM = 'SUM', // 求和
  MIN = 'MIN', // 取最小值
  MAX = 'MAX', // 取最大值
}

export interface IndividualScore {
  employeeId: string;
  employeeName: string;
  departmentId: string;
  totalScore: number;
  isLeader?: boolean; // 是否为部门负责人
  weight?: number; // 个人权重（用于加权平均）
}

export interface DepartmentScore {
  departmentId: string;
  departmentName: string;
  companyId: string;
  totalScore: number;
  employeeCount: number;
  method: RollupMethod;
}

export interface CompanyScore {
  companyId: string;
  companyName: string;
  totalScore: number;
  departmentCount: number;
  method: RollupMethod;
}

@Injectable()
export class RollupEngine {
  /** 计算部门绩效得分 */
  calculateDepartmentScore(
    scores: IndividualScore[],
    method: RollupMethod = RollupMethod.AVERAGE,
  ): number {
    if (scores.length === 0) return 0;

    switch (method) {
      case RollupMethod.AVERAGE:
        return this.calculateAverage(scores.map((s) => s.totalScore));

      case RollupMethod.WEIGHTED_AVERAGE:
        return this.calculateWeightedAverage(scores);

      case RollupMethod.LEADER_SCORE:
        const leader = scores.find((s) => s.isLeader);
        return leader
          ? leader.totalScore
          : this.calculateAverage(scores.map((s) => s.totalScore));

      case RollupMethod.SUM:
        return scores.reduce((sum, s) => sum + s.totalScore, 0);

      case RollupMethod.MIN:
        return Math.min(...scores.map((s) => s.totalScore));

      case RollupMethod.MAX:
        return Math.max(...scores.map((s) => s.totalScore));

      default:
        return this.calculateAverage(scores.map((s) => s.totalScore));
    }
  }

  /** 计算公司/工厂绩效得分 */
  calculateCompanyScore(
    departmentScores: DepartmentScore[],
    method: RollupMethod = RollupMethod.WEIGHTED_AVERAGE,
    weights?: Map<string, number>, // 部门ID -> 权重
  ): number {
    if (departmentScores.length === 0) return 0;

    switch (method) {
      case RollupMethod.AVERAGE:
        return this.calculateAverage(departmentScores.map((d) => d.totalScore));

      case RollupMethod.WEIGHTED_AVERAGE:
        if (weights) {
          const totalWeight = Array.from(weights.values()).reduce(
            (a, b) => a + b,
            0,
          );
          const weightedSum = departmentScores.reduce((sum, d) => {
            const w = weights.get(d.departmentId) || 0;
            return sum + d.totalScore * w;
          }, 0);
          return totalWeight > 0 ? weightedSum / totalWeight : 0;
        }
        return this.calculateAverage(departmentScores.map((d) => d.totalScore)); // 无权重时退化为平均

      case RollupMethod.SUM:
        return departmentScores.reduce((sum, d) => sum + d.totalScore, 0);

      default:
        return this.calculateAverage(departmentScores.map((d) => d.totalScore));
    }
  }

  /** 按部门分组计算 */
  groupByDepartment(scores: IndividualScore[]): Map<string, IndividualScore[]> {
    const grouped = new Map<string, IndividualScore[]>();

    for (const score of scores) {
      const existing = grouped.get(score.departmentId) || [];
      existing.push(score);
      grouped.set(score.departmentId, existing);
    }

    return grouped;
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateWeightedAverage(scores: IndividualScore[]): number {
    const totalWeight = scores.reduce((sum, s) => sum + (s.weight || 1), 0);
    if (totalWeight === 0) return 0;

    const weightedSum = scores.reduce(
      (sum, s) => sum + s.totalScore * (s.weight || 1),
      0,
    );
    return weightedSum / totalWeight;
  }
}
