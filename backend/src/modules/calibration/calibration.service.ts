import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PerformanceGrade, KPIStatusEnum } from '@prisma/client';
import { determinePerformanceGrade, determineKPIStatus } from '../../common/constants/grade-boundaries';

@Injectable()
export class CalibrationService {
  constructor(private prisma: PrismaService) {}

  async createSession(companyId: string, userId: string, data: { name: string; periodId: string; departmentIds: string[] }) {
    const performances = await this.prisma.employeePerformance.findMany({
      where: { periodId: data.periodId, departmentId: { in: data.departmentIds } },
    });

    const originalStats = this.calculateStats(performances.map((p) => p.totalScore));

    return this.prisma.calibrationSession.create({
      data: {
        ...data,
        companyId,
        createdById: userId,
        departmentIds: data.departmentIds,
        originalStats,
        status: 'draft',
      },
    });
  }

  async getSessions(companyId: string, periodId?: string) {
    const where: any = { companyId };
    if (periodId) where.periodId = periodId;

    return this.prisma.calibrationSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSessionDetail(sessionId: string) {
    const session = await this.prisma.calibrationSession.findUnique({
      where: { id: sessionId },
      include: { adjustments: true },
    });

    if (!session) throw new NotFoundException('会话不存在');

    const departmentIds = session.departmentIds as string[];
    const performances = await this.prisma.employeePerformance.findMany({
      where: { periodId: session.periodId, departmentId: { in: departmentIds } },
    });

    const adjustmentMap = new Map(session.adjustments.map((a) => [a.employeeId, a]));
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: performances.map((p) => p.employeeId) } },
      include: { department: true },
    });

    const data = performances.map((p) => {
      const emp = employees.find((e) => e.id === p.employeeId);
      const adj = adjustmentMap.get(p.employeeId);
      return {
        employeeId: p.employeeId,
        employeeName: emp?.name || 'Unknown',
        departmentName: emp?.department?.name || 'Unknown',
        originalScore: p.totalScore,
        adjustedScore: adj?.adjustedScore ?? p.totalScore,
        originalGrade: this.determineGrade(p.totalScore),
        adjustedGrade: adj ? this.determineGrade(adj.adjustedScore) : this.determineGrade(p.totalScore),
        isAdjusted: !!adj,
        reason: adj?.reason,
      };
    });

    return { session, employees: data };
  }

  async adjustScore(sessionId: string, userId: string, employeeId: string, adjustedScore: number, reason?: string) {
    const session = await this.prisma.calibrationSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('会话不存在');
    if (session.status === 'completed') throw new BadRequestException('会话已完成，无法调整');

    const performance = await this.prisma.employeePerformance.findFirst({
      where: { periodId: session.periodId, employeeId },
    });

    const originalScore = performance?.totalScore || 0;

    return this.prisma.calibrationAdjustment.upsert({
      where: { sessionId_employeeId: { sessionId, employeeId } },
      create: {
        sessionId,
        employeeId,
        originalScore,
        adjustedScore,
        originalGrade: this.determineGrade(originalScore),
        adjustedGrade: this.determineGrade(adjustedScore),
        reason,
        adjustedById: userId,
      },
      update: {
        adjustedScore,
        adjustedGrade: this.determineGrade(adjustedScore),
        reason,
        adjustedById: userId,
      },
    });
  }

  async batchAdjust(sessionId: string, userId: string, adjustments: Array<{ employeeId: string; adjustedScore: number; reason?: string }>) {
    const session = await this.prisma.calibrationSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('会话不存在');
    if (session.status === 'completed') throw new BadRequestException('会话已完成，无法调整');

    const employeeIds = adjustments.map(a => a.employeeId); // 批量获取绩效数据
    const performances = await this.prisma.employeePerformance.findMany({
      where: { periodId: session.periodId, employeeId: { in: employeeIds } },
    });
    const perfMap = new Map(performances.map(p => [p.employeeId, p.totalScore]));

    const operations = adjustments.map(adj => {
      const originalScore = perfMap.get(adj.employeeId) || 0;
      return this.prisma.calibrationAdjustment.upsert({
        where: { sessionId_employeeId: { sessionId, employeeId: adj.employeeId } },
        create: {
          sessionId,
          employeeId: adj.employeeId,
          originalScore,
          adjustedScore: adj.adjustedScore,
          originalGrade: this.determineGrade(originalScore),
          adjustedGrade: this.determineGrade(adj.adjustedScore),
          reason: adj.reason,
          adjustedById: userId,
        },
        update: {
          adjustedScore: adj.adjustedScore,
          adjustedGrade: this.determineGrade(adj.adjustedScore),
          reason: adj.reason,
          adjustedById: userId,
        },
      });
    });

    return this.prisma.$transaction(operations); // 使用事务批量执行
  }

  async startSession(sessionId: string) {
    return this.prisma.calibrationSession.update({
      where: { id: sessionId },
      data: { status: 'in_progress' },
    });
  }

  async completeSession(sessionId: string) {
    const session = await this.prisma.calibrationSession.findUnique({
      where: { id: sessionId },
      include: { adjustments: true },
    });

    if (!session) throw new NotFoundException('会话不存在');

    for (const adj of session.adjustments) {
      await this.prisma.employeePerformance.updateMany({
        where: { periodId: session.periodId, employeeId: adj.employeeId },
        data: {
          totalScore: adj.adjustedScore,
          status: this.determineStatus(adj.adjustedScore), // 同步更新绩效状态
        },
      });
    }

    const performances = await this.prisma.employeePerformance.findMany({
      where: { periodId: session.periodId, departmentId: { in: session.departmentIds as string[] } },
    });
    const calibratedStats = this.calculateStats(performances.map((p) => p.totalScore));

    return this.prisma.calibrationSession.update({
      where: { id: sessionId },
      data: { status: 'completed', calibratedStats, completedAt: new Date() },
    });
  }

  private calculateStats(scores: number[]) {
    if (scores.length === 0) return { avg: 0, min: 0, max: 0, stdDev: 0, count: 0 };
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
    return {
      avg: Math.round(avg * 100) / 100,
      min: Math.min(...scores),
      max: Math.max(...scores),
      stdDev: Math.round(Math.sqrt(variance) * 100) / 100,
      count: scores.length,
    };
  }

  private determineGrade(score: number): PerformanceGrade {
    return determinePerformanceGrade(score); // 使用统一边界配置
  }

  private determineStatus(score: number): KPIStatusEnum {
    return determineKPIStatus(score); // 使用统一边界配置
  }
}
