import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PerformanceGrade } from '@prisma/client';
import { determinePerformanceGrade } from '../../common/constants/grade-boundaries';

const DEFAULT_COEFFICIENTS = { S: 1.5, A: 1.2, B: 1.0, C: 0.8, D: 0.5 };

@Injectable()
export class SalaryService {
  constructor(private prisma: PrismaService) {}

  async getCoefficients(companyId: string) {
    const config = await this.prisma.salaryCoefficient.findUnique({
      where: { companyId },
    });
    return (
      config || { coefficients: DEFAULT_COEFFICIENTS, bonusBaseType: 'fixed' }
    );
  }

  async saveCoefficients(
    companyId: string,
    dto: { coefficients: Record<string, number>; bonusBaseType?: string },
  ) {
    return this.prisma.salaryCoefficient.upsert({
      where: { companyId },
      create: {
        companyId,
        coefficients: dto.coefficients,
        bonusBaseType: dto.bonusBaseType || 'fixed',
      },
      update: {
        coefficients: dto.coefficients,
        bonusBaseType: dto.bonusBaseType,
      },
    });
  }

  async calculateSalaries(
    companyId: string,
    periodId: string,
    baseBonusAmount?: number,
  ) {
    const config = await this.getCoefficients(companyId);
    const coefficients =
      (config.coefficients as Record<string, number>) || DEFAULT_COEFFICIENTS;

    const performances = await this.prisma.employeePerformance.findMany({
      where: { periodId, companyId },
    });

    const results: any[] = [];
    for (const perf of performances) {
      const grade = this.getGradeFromScore(perf.totalScore);
      const coefficient = coefficients[grade] || 1.0;
      const bonusAmount = baseBonusAmount
        ? baseBonusAmount * coefficient
        : undefined;

      const calc = await this.prisma.salaryCalculation.upsert({
        where: {
          periodId_employeeId: { periodId, employeeId: perf.employeeId },
        },
        create: {
          periodId,
          employeeId: perf.employeeId,
          companyId,
          performanceScore: perf.totalScore,
          performanceGrade: grade as any,
          coefficient,
          bonusAmount,
        },
        update: {
          performanceScore: perf.totalScore,
          performanceGrade: grade as any,
          coefficient,
          bonusAmount,
        },
      });
      results.push(calc);
    }

    return { calculated: results.length, results };
  }

  async getSalaryCalculations(companyId: string, periodId: string) {
    const calculations = await this.prisma.salaryCalculation.findMany({
      where: { periodId, companyId },
      orderBy: { performanceScore: 'desc' },
    });

    const employeeIds = calculations.map((c) => c.employeeId);
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      include: { department: true },
    });
    const empMap = new Map(employees.map((e) => [e.id, e]));

    return calculations.map((c) => ({
      ...c,
      employee: empMap.get(c.employeeId),
    }));
  }

  async exportSalaryData(
    companyId: string,
    periodId: string,
    format: string = 'json',
  ) {
    const calculations = await this.getSalaryCalculations(companyId, periodId);

    const data = calculations.map((c) => ({
      employeeId: (c.employee as any)?.employeeId || c.employeeId,
      employeeName: (c.employee as any)?.name || 'Unknown',
      department: (c.employee as any)?.department?.name || '',
      performanceScore: c.performanceScore,
      performanceGrade: c.performanceGrade,
      coefficient: c.coefficient,
      bonusAmount: c.bonusAmount,
    }));

    await this.prisma.salaryCalculation.updateMany({
      where: { periodId, companyId },
      data: { exportedAt: new Date() },
    });

    return data;
  }

  async getSummary(companyId: string, periodId: string) {
    const calculations = await this.prisma.salaryCalculation.findMany({
      where: { periodId, companyId },
    });

    const gradeCounts = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    let totalBonus = 0;
    let avgCoefficient = 0;

    for (const c of calculations) {
      gradeCounts[c.performanceGrade]++;
      totalBonus += c.bonusAmount || 0;
      avgCoefficient += c.coefficient;
    }

    return {
      totalEmployees: calculations.length,
      gradeCounts,
      totalBonus,
      avgCoefficient:
        calculations.length > 0 ? avgCoefficient / calculations.length : 0,
      exportedCount: calculations.filter((c) => c.exportedAt).length,
    };
  }

  private getGradeFromScore(score: number): PerformanceGrade {
    return determinePerformanceGrade(score); // 使用统一边界配置
  }
}
