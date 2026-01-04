import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreateTodoDto, UpdateTodoDto, QueryTodoDto } from './dto/todo.dto';

export interface BusinessTodo {
  id: string;
  type: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  link: string;
}

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTodoDto, userId: string, companyId: string) {
    return this.prisma.todo.create({
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        userId,
        companyId,
      },
    });
  }

  async findAll(userId: string, query: QueryTodoDto) {
    const { completed, priority, page = '1', limit = '20' } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId };
    if (typeof completed === 'boolean') where.completed = completed;
    if (priority) where.priority = priority;

    const [data, total] = await Promise.all([
      this.prisma.todo.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.todo.count({ where }),
    ]);

    return {
      data,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    };
  }

  async findOne(id: string, userId: string) {
    return this.prisma.todo.findFirst({ where: { id, userId } });
  }

  async update(id: string, dto: UpdateTodoDto, userId: string) {
    const updateData: any = { ...dto };
    if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);
    if (dto.completed === true) updateData.completedAt = new Date();
    if (dto.completed === false) updateData.completedAt = null;

    return this.prisma.todo.updateMany({ where: { id, userId }, data: updateData });
  }

  async remove(id: string, userId: string) {
    return this.prisma.todo.deleteMany({ where: { id, userId } });
  }

  async toggleComplete(id: string, userId: string) {
    const todo = await this.prisma.todo.findFirst({ where: { id, userId } });
    if (!todo) return null;
    return this.prisma.todo.update({
      where: { id },
      data: { completed: !todo.completed, completedAt: !todo.completed ? new Date() : null },
    });
  }

  async getBusinessTodos(userId: string, companyId: string, role: UserRole): Promise<BusinessTodo[]> {
    const todos: BusinessTodo[] = [];
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const isManager = ['GROUP_ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(role);

    try {
      const activePeriods = await this.prisma.assessmentPeriod.findMany({
        where: { companyId, status: 'ACTIVE' },
        orderBy: { endDate: 'asc' },
      });

      for (const period of activePeriods) {
        if (period.endDate <= sevenDaysLater) {
          todos.push({
            id: `period-${period.id}`,
            type: 'period_expiring',
            title: `考核周期"${period.name}"即将截止`,
            dueDate: period.endDate,
            priority: period.endDate <= now ? 'HIGH' : 'MEDIUM',
            link: '/app/data-entry',
          });
        }
      }

      if (isManager) {
        const pendingSubmissions = await this.prisma.dataSubmission.findMany({
          where: { companyId, status: 'PENDING' },
          include: { period: { select: { name: true } } },
          take: 10,
        });
        for (const sub of pendingSubmissions) {
          todos.push({
            id: `approval-${sub.id}`,
            type: 'approval_pending',
            title: `${sub.period.name} 数据提交待审批`,
            priority: 'HIGH',
            link: '/app/data-approval',
          });
        }

        const lowPerformers = await this.prisma.employeePerformance.findMany({
          where: { companyId, totalScore: { lt: 60 } },
          take: 5,
        });
        for (const perf of lowPerformers) {
          todos.push({
            id: `low-perf-${perf.id}`,
            type: 'low_performance',
            title: `员工绩效低于60分需关注`,
            priority: 'MEDIUM',
            link: '/app/reports',
          });
        }

        const pendingCalibrations = await this.prisma.calibrationSession.findMany({
          where: { companyId, status: 'draft' },
          take: 5,
        });
        for (const cal of pendingCalibrations) {
          todos.push({
            id: `calibration-${cal.id}`,
            type: 'calibration_pending',
            title: `校准会议"${cal.name}"待处理`,
            priority: 'MEDIUM',
            link: '/app/calibration',
          });
        }

        if (activePeriods.length > 0) {
          const missingInterviews = await this.prisma.performanceInterview.findMany({
            where: {
              companyId,
              periodId: activePeriods[0].id,
              interviewerId: userId,
              conductedAt: null,
            },
            take: 5,
          });
          for (const int of missingInterviews) {
            todos.push({
              id: `interview-${int.id}`,
              type: 'interview_pending',
              title: `绩效面谈待安排`,
              dueDate: int.scheduledAt,
              priority: int.scheduledAt < now ? 'HIGH' : 'MEDIUM',
              link: '/app/interview',
            });
          }
        }
      }

      const draftSubmissions = await this.prisma.dataSubmission.findMany({
        where: { companyId, submittedById: userId, status: 'DRAFT' },
        include: { period: { select: { name: true } } },
        take: 5,
      });
      for (const sub of draftSubmissions) {
        todos.push({
          id: `draft-${sub.id}`,
          type: 'submission_draft',
          title: `${sub.period.name} 数据填报未提交`,
          priority: 'MEDIUM',
          link: '/app/data-entry',
        });
      }
    } catch {
      // silent fail for business todos
    }

    return todos.sort((a, b) => {
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}
