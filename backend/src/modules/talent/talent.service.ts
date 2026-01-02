import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const GRID_POSITIONS = {
  star: { performance: 'high', potential: 'high', label: '明星员工' },
  growth: { performance: 'medium', potential: 'high', label: '高潜力' },
  enigma: { performance: 'low', potential: 'high', label: '待发掘' },
  core: { performance: 'high', potential: 'medium', label: '核心骨干' },
  backbone: { performance: 'medium', potential: 'medium', label: '中坚力量' },
  inconsistent: { performance: 'low', potential: 'medium', label: '待观察' },
  trusted: { performance: 'high', potential: 'low', label: '熟练工' },
  effective: { performance: 'medium', potential: 'low', label: '稳定贡献' },
  risk: { performance: 'low', potential: 'low', label: '需关注' },
};

@Injectable()
export class TalentService {
  constructor(private prisma: PrismaService) {}

  async assessPotential(
    companyId: string,
    userId: string,
    dto: {
      employeeId: string;
      periodId: string;
      learningAgility: number;
      leadershipPotential: number;
      technicalDepth: number;
      collaborationSkill: number;
    },
  ) {
    const potentialScore =
      (dto.learningAgility +
        dto.leadershipPotential +
        dto.technicalDepth +
        dto.collaborationSkill) /
      4;

    const performance = await this.prisma.employeePerformance.findFirst({
      where: { employeeId: dto.employeeId, periodId: dto.periodId },
    });

    const gridPosition = this.calculateGridPosition(
      performance?.totalScore || 0,
      potentialScore,
    );

    return this.prisma.potentialAssessment.upsert({
      where: {
        employeeId_periodId: {
          employeeId: dto.employeeId,
          periodId: dto.periodId,
        },
      },
      create: {
        ...dto,
        companyId,
        potentialScore,
        gridPosition,
        assessorId: userId,
      },
      update: {
        learningAgility: dto.learningAgility,
        leadershipPotential: dto.leadershipPotential,
        technicalDepth: dto.technicalDepth,
        collaborationSkill: dto.collaborationSkill,
        potentialScore,
        gridPosition,
        assessorId: userId,
      },
    });
  }

  async getNineBoxData(companyId: string, periodId: string) {
    const assessments = await this.prisma.potentialAssessment.findMany({
      where: { companyId, periodId },
    });

    const employeeIds = assessments.map((a) => a.employeeId);
    const performances = await this.prisma.employeePerformance.findMany({
      where: { periodId, employeeId: { in: employeeIds } },
    });
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      include: { department: true },
    });

    const perfMap = new Map(performances.map((p) => [p.employeeId, p]));
    const empMap = new Map(employees.map((e) => [e.id, e]));

    const data = assessments.map((a) => {
      const perf = perfMap.get(a.employeeId);
      const emp = empMap.get(a.employeeId);
      return {
        employeeId: a.employeeId,
        employeeName: emp?.name || 'Unknown',
        departmentName: emp?.department?.name || '',
        performanceScore: perf?.totalScore || 0,
        potentialScore: a.potentialScore,
        gridPosition: a.gridPosition,
        gridLabel: a.gridPosition
          ? GRID_POSITIONS[a.gridPosition]?.label || '未分类'
          : '未分类',
        assessment: a,
      };
    });

    const gridCounts = {};
    for (const pos of Object.keys(GRID_POSITIONS)) {
      gridCounts[pos] = data.filter((d) => d.gridPosition === pos).length;
    }

    return { employees: data, gridCounts, gridPositions: GRID_POSITIONS };
  }

  async getEmployeeAssessment(employeeId: string, periodId: string) {
    const assessment = await this.prisma.potentialAssessment.findUnique({
      where: { employeeId_periodId: { employeeId, periodId } },
    });

    const performance = await this.prisma.employeePerformance.findFirst({
      where: { employeeId, periodId },
    });

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { department: true },
    });

    return {
      employee,
      assessment,
      performance,
      gridPosition: assessment?.gridPosition,
      gridLabel: assessment?.gridPosition
        ? GRID_POSITIONS[assessment.gridPosition]?.label
        : null,
    };
  }

  async getAssessmentHistory(employeeId: string) {
    return this.prisma.potentialAssessment.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private calculateGridPosition(
    performanceScore: number,
    potentialScore: number,
  ): string {
    const perfLevel =
      performanceScore >= 85
        ? 'high'
        : performanceScore >= 70
          ? 'medium'
          : 'low';
    const potLevel =
      potentialScore >= 4 ? 'high' : potentialScore >= 3 ? 'medium' : 'low';

    for (const [pos, config] of Object.entries(GRID_POSITIONS)) {
      if (config.performance === perfLevel && config.potential === potLevel) {
        return pos;
      }
    }
    return 'backbone';
  }
}
