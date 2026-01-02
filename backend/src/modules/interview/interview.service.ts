import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class InterviewService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async scheduleInterview(
    companyId: string,
    userId: string,
    dto: { periodId: string; employeeId: string; scheduledAt: Date },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    const existing = await this.prisma.performanceInterview.findUnique({
      where: {
        periodId_employeeId: {
          periodId: dto.periodId,
          employeeId: dto.employeeId,
        },
      },
    });

    if (existing) {
      return this.prisma.performanceInterview.update({
        where: { id: existing.id },
        data: {
          scheduledAt: dto.scheduledAt,
          interviewerId: userId,
          interviewerName: user.username,
        },
      });
    }

    const interview = await this.prisma.performanceInterview.create({
      data: {
        ...dto,
        companyId,
        interviewerId: userId,
        interviewerName: user.username,
      },
    });

    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (employee?.id) {
      const linkedUser = await this.prisma.user.findFirst({
        where: { linkedEmployeeId: dto.employeeId },
      });
      if (linkedUser) {
        await this.notifications.send(
          {
            userId: linkedUser.id,
            type: 'INTERVIEW_SCHEDULED' as any,
            title: '面谈已安排',
            content: `您的绩效面谈已安排在 ${new Date(dto.scheduledAt).toLocaleString()}`,
            relatedType: 'interview',
            relatedId: interview.id,
          },
          companyId,
        );
      }
    }

    return interview;
  }

  async getInterviews(companyId: string, periodId?: string, status?: string) {
    const where: any = { companyId };
    if (periodId) where.periodId = periodId;

    if (status === 'pending') {
      where.conductedAt = null;
    } else if (status === 'completed') {
      where.conductedAt = { not: null };
    } else if (status === 'unconfirmed') {
      where.conductedAt = { not: null };
      where.employeeConfirmed = false;
    }

    const interviews = await this.prisma.performanceInterview.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
    });

    const employeeIds = interviews.map((i) => i.employeeId);
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      include: { department: true },
    });
    const empMap = new Map(employees.map((e) => [e.id, e]));

    return interviews.map((i) => ({
      ...i,
      employee: empMap.get(i.employeeId),
    }));
  }

  async getInterviewDetail(id: string) {
    const interview = await this.prisma.performanceInterview.findUnique({
      where: { id },
    });
    if (!interview) throw new NotFoundException('面谈记录不存在');

    const employee = await this.prisma.employee.findUnique({
      where: { id: interview.employeeId },
      include: { department: true },
    });

    const period = await this.prisma.assessmentPeriod.findUnique({
      where: { id: interview.periodId },
    });
    const performance = await this.prisma.employeePerformance.findFirst({
      where: { periodId: interview.periodId, employeeId: interview.employeeId },
    });

    return { ...interview, employee, period, performance };
  }

  async conductInterview(
    id: string,
    userId: string,
    dto: {
      summary: string;
      strengths?: string;
      improvements?: string;
      goals?: string;
    },
  ) {
    const interview = await this.prisma.performanceInterview.findUnique({
      where: { id },
    });
    if (!interview) throw new NotFoundException('面谈记录不存在');

    return this.prisma.performanceInterview.update({
      where: { id },
      data: {
        ...dto,
        conductedAt: new Date(),
      },
    });
  }

  async employeeConfirm(id: string, userId: string, feedback?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const interview = await this.prisma.performanceInterview.findUnique({
      where: { id },
    });

    if (!interview) throw new NotFoundException('面谈记录不存在');
    if (!interview.conductedAt) throw new BadRequestException('面谈尚未进行');
    if (!user) throw new NotFoundException('用户不存在');

    if (user.linkedEmployeeId !== interview.employeeId) {
      throw new BadRequestException('只能确认自己的面谈记录');
    }

    return this.prisma.performanceInterview.update({
      where: { id },
      data: {
        employeeConfirmed: true,
        employeeConfirmedAt: new Date(),
        employeeFeedback: feedback,
      },
    });
  }

  async getMyInterviews(userId: string, companyId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.linkedEmployeeId) return [];

    return this.prisma.performanceInterview.findMany({
      where: { employeeId: user.linkedEmployeeId, companyId },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async getPendingConfirmations(companyId: string) {
    return this.prisma.performanceInterview.findMany({
      where: {
        companyId,
        conductedAt: { not: null },
        employeeConfirmed: false,
      },
      orderBy: { conductedAt: 'desc' },
    });
  }
}
