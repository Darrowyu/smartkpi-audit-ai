import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const DEFAULT_DISTRIBUTION = { S: 10, A: 20, B: 40, C: 20, D: 10 };
const DEFAULT_BOUNDARIES = { S: 95, A: 85, B: 70, C: 60 };

@Injectable()
export class DistributionService {
  constructor(private prisma: PrismaService) {}

  async getConfig(companyId: string, periodId?: string) {
    let config = await this.prisma.distributionConfig.findFirst({
      where: { companyId, periodId: periodId || null },
    });

    if (!config && periodId) {
      config = await this.prisma.distributionConfig.findFirst({
        where: { companyId, periodId: null },
      });
    }

    if (!config) {
      return {
        distribution: DEFAULT_DISTRIBUTION,
        scoreBoundaries: DEFAULT_BOUNDARIES,
        isEnforced: false,
        tolerance: 5,
      };
    }

    return config;
  }

  async saveConfig(companyId: string, dto: { periodId?: string; distribution: Record<string, number>; scoreBoundaries?: Record<string, number>; isEnforced?: boolean; tolerance?: number }) {
    const total = Object.values(dto.distribution).reduce((a, b) => a + b, 0);
    if (Math.abs(total - 100) > 0.01) {
      throw new BadRequestException('分布比例总和必须为100%');
    }

    const existing = await this.prisma.distributionConfig.findFirst({
      where: { companyId, periodId: dto.periodId || null },
    });

    if (existing) {
      return this.prisma.distributionConfig.update({
        where: { id: existing.id },
        data: {
          distribution: dto.distribution,
          scoreBoundaries: dto.scoreBoundaries,
          isEnforced: dto.isEnforced,
          tolerance: dto.tolerance,
        },
      });
    }

    return this.prisma.distributionConfig.create({
      data: {
        companyId,
        periodId: dto.periodId,
        distribution: dto.distribution,
        scoreBoundaries: dto.scoreBoundaries || DEFAULT_BOUNDARIES,
        isEnforced: dto.isEnforced ?? false,
        tolerance: dto.tolerance ?? 5,
      },
    });
  }

  async validateDistribution(companyId: string, periodId: string) {
    const config = await this.getConfig(companyId, periodId);
    if (!config.isEnforced) return { valid: true, message: '未启用强制分布' };

    const performances = await this.prisma.employeePerformance.findMany({
      where: { periodId, companyId },
    });

    if (performances.length === 0) return { valid: true, message: '无绩效数据' };

    const distribution = config.distribution as Record<string, number>;
    const boundaries = (config.scoreBoundaries as Record<string, number>) || DEFAULT_BOUNDARIES;
    const tolerance = config.tolerance || 5;

    const actualCounts = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    for (const p of performances) {
      const grade = this.getGradeFromScore(p.totalScore, boundaries);
      actualCounts[grade]++;
    }

    const total = performances.length;
    const violations: string[] = [];

    for (const [grade, expectedPercent] of Object.entries(distribution)) {
      const actualPercent = (actualCounts[grade] / total) * 100;
      const diff = Math.abs(actualPercent - expectedPercent);
      if (diff > tolerance) {
        violations.push(`${grade}等级: 期望${expectedPercent}%, 实际${actualPercent.toFixed(1)}%`);
      }
    }

    return {
      valid: violations.length === 0,
      message: violations.length === 0 ? '分布符合要求' : '分布不符合要求',
      violations,
      actual: actualCounts,
      expected: distribution,
      total,
    };
  }

  async getDistributionStats(companyId: string, periodId: string) {
    const performances = await this.prisma.employeePerformance.findMany({
      where: { periodId, companyId },
    });

    const config = await this.getConfig(companyId, periodId);
    const boundaries = (config.scoreBoundaries as Record<string, number>) || DEFAULT_BOUNDARIES;

    const counts = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    for (const p of performances) {
      const grade = this.getGradeFromScore(p.totalScore, boundaries);
      counts[grade]++;
    }

    const total = performances.length;
    return {
      counts,
      percentages: {
        S: total > 0 ? (counts.S / total) * 100 : 0,
        A: total > 0 ? (counts.A / total) * 100 : 0,
        B: total > 0 ? (counts.B / total) * 100 : 0,
        C: total > 0 ? (counts.C / total) * 100 : 0,
        D: total > 0 ? (counts.D / total) * 100 : 0,
      },
      total,
      config,
    };
  }

  private getGradeFromScore(score: number, boundaries: Record<string, number>): string {
    if (score >= boundaries.S) return 'S';
    if (score >= boundaries.A) return 'A';
    if (score >= boundaries.B) return 'B';
    if (score >= boundaries.C) return 'C';
    return 'D';
  }
}
