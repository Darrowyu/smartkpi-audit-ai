import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CheckInService {
  constructor(private prisma: PrismaService) {}

  async createCheckIn(companyId: string, employeeId: string, dto: { assignmentId: string; currentValue: number; notes?: string; attachments?: string[]; riskLevel?: string }) {
    const assignment = await this.prisma.kPIAssignment.findUnique({
      where: { id: dto.assignmentId },
    });

    if (!assignment) throw new NotFoundException('KPI分配不存在');

    const progressPercent = assignment.targetValue > 0 ? (dto.currentValue / assignment.targetValue) * 100 : 0;

    return this.prisma.progressCheckIn.create({
      data: {
        assignmentId: dto.assignmentId,
        employeeId,
        companyId,
        checkInDate: new Date(),
        currentValue: dto.currentValue,
        progressPercent: Math.round(progressPercent * 100) / 100,
        notes: dto.notes,
        attachments: dto.attachments,
        riskLevel: dto.riskLevel || this.determineRiskLevel(progressPercent),
      },
    });
  }

  async getCheckIns(companyId: string, filters: { assignmentId?: string; employeeId?: string; startDate?: Date; endDate?: Date }) {
    const where: any = { companyId };

    if (filters.assignmentId) where.assignmentId = filters.assignmentId;
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.startDate || filters.endDate) {
      where.checkInDate = {};
      if (filters.startDate) where.checkInDate.gte = filters.startDate;
      if (filters.endDate) where.checkInDate.lte = filters.endDate;
    }

    const checkIns = await this.prisma.progressCheckIn.findMany({
      where,
      orderBy: { checkInDate: 'desc' },
    });

    const assignmentIds = [...new Set(checkIns.map((c) => c.assignmentId))];
    const assignments = await this.prisma.kPIAssignment.findMany({
      where: { id: { in: assignmentIds } },
      include: { kpiDefinition: true },
    });
    const assignMap = new Map(assignments.map((a) => [a.id, a]));

    const employeeIds = [...new Set(checkIns.map((c) => c.employeeId))];
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      include: { department: true },
    });
    const empMap = new Map(employees.map((e) => [e.id, e]));

    return checkIns.map((c) => ({
      ...c,
      assignment: assignMap.get(c.assignmentId),
      employee: empMap.get(c.employeeId),
    }));
  }

  async getMyCheckIns(userId: string, companyId: string, periodId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.linkedEmployeeId) return [];

    let assignmentIds: string[] | undefined;
    if (periodId) {
      const assignments = await this.prisma.kPIAssignment.findMany({
        where: { periodId },
        select: { id: true },
      });
      assignmentIds = assignments.map((a) => a.id);
    }

    const where: any = { employeeId: user.linkedEmployeeId, companyId };
    if (assignmentIds) where.assignmentId = { in: assignmentIds };

    return this.prisma.progressCheckIn.findMany({
      where,
      orderBy: { checkInDate: 'desc' },
    });
  }

  async addManagerFeedback(checkInId: string, userId: string, feedback: string) {
    const checkIn = await this.prisma.progressCheckIn.findUnique({ where: { id: checkInId } });
    if (!checkIn) throw new NotFoundException('检查点不存在');

    return this.prisma.progressCheckIn.update({
      where: { id: checkInId },
      data: {
        managerFeedback: feedback,
        feedbackById: userId,
        feedbackAt: new Date(),
      },
    });
  }

  async getProgressSummary(companyId: string, periodId: string) {
    const assignments = await this.prisma.kPIAssignment.findMany({
      where: { periodId, companyId },
      include: { kpiDefinition: true },
    });

    const assignmentIds = assignments.map((a) => a.id);
    const latestCheckIns = await this.prisma.$queryRaw`
      SELECT DISTINCT ON (assignment_id) *
      FROM progress_check_ins
      WHERE assignment_id = ANY(${assignmentIds}::uuid[])
      ORDER BY assignment_id, check_in_date DESC
    ` as any[];

    const checkInMap = new Map(latestCheckIns.map((c) => [c.assignment_id, c]));

    const summary = {
      total: assignments.length,
      onTrack: 0,
      atRisk: 0,
      critical: 0,
      noUpdate: 0,
    };

    const details = assignments.map((a) => {
      const checkIn = checkInMap.get(a.id);
      let status = 'no_update';

      if (checkIn) {
        if (checkIn.risk_level === 'critical') {
          status = 'critical';
          summary.critical++;
        } else if (checkIn.risk_level === 'warning') {
          status = 'at_risk';
          summary.atRisk++;
        } else {
          status = 'on_track';
          summary.onTrack++;
        }
      } else {
        summary.noUpdate++;
      }

      return {
        assignment: a,
        latestCheckIn: checkIn,
        status,
      };
    });

    return { summary, details };
  }

  async getRiskAlerts(companyId: string) {
    return this.prisma.progressCheckIn.findMany({
      where: {
        companyId,
        riskLevel: { in: ['warning', 'critical'] },
        checkInDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { checkInDate: 'desc' },
      take: 50,
    });
  }

  private determineRiskLevel(progressPercent: number): string {
    if (progressPercent >= 80) return 'normal';
    if (progressPercent >= 50) return 'warning';
    return 'critical';
  }
}
