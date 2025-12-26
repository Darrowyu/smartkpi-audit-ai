import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreatePeriodDto,
  UpdatePeriodDto,
  QueryPeriodDto,
  CreateSubmissionDto,
  UpdateSubmissionDto,
  DataEntryDto,
} from './dto';
import { PeriodStatus, SubmissionStatus } from '@prisma/client';

@Injectable()
export class AssessmentService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) { }

  // ==================== Period 考核周期 ====================

  /** 创建考核周期 */
  async createPeriod(dto: CreatePeriodDto, companyId: string, userId: string) {
    const overlap = await this.prisma.assessmentPeriod.findFirst({
      // 检查日期重叠
      where: {
        companyId,
        OR: [
          {
            startDate: { lte: new Date(dto.endDate) },
            endDate: { gte: new Date(dto.startDate) },
          },
        ],
      },
    });

    if (overlap) {
      throw new ConflictException(`考核周期与"${overlap.name}"存在日期重叠`);
    }

    return this.prisma.assessmentPeriod.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        lockDate: dto.lockDate ? new Date(dto.lockDate) : undefined,
        companyId,
        createdById: userId,
      },
    });
  }

  /** 获取考核周期列表 */
  async findPeriods(query: QueryPeriodDto, companyId: string) {
    const { status, year, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = {
      companyId,
      ...(status && { status }),
      ...(year && {
        startDate: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${Number(year) + 1}-01-01`),
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.assessmentPeriod.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          _count: { select: { submissions: true, assignments: true } },
        },
      }),
      this.prisma.assessmentPeriod.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** 更新周期状态 */
  async updatePeriod(id: string, dto: UpdatePeriodDto, companyId: string) {
    const period = await this.prisma.assessmentPeriod.findFirst({
      where: { id, companyId },
    });
    if (!period) throw new NotFoundException('考核周期不存在');

    if (
      period.status === PeriodStatus.LOCKED &&
      dto.status !== PeriodStatus.ARCHIVED
    ) {
      throw new BadRequestException('已锁定的周期不可修改');
    }

    if (dto.status && dto.status !== period.status) {
      await this.validateStatusTransition(id, period.status, dto.status, companyId);
    }

    const result = await this.prisma.assessmentPeriod.update({
      where: { id },
      data: {
        ...dto,
        lockDate: dto.lockDate ? new Date(dto.lockDate) : period.lockDate,
      },
    });

    // 状态变更通知
    if (dto.status && dto.status !== period.status) {
      if (dto.status === PeriodStatus.ACTIVE) {
        await this.notificationsService.notifyPeriodActivated(
          id,
          period.name,
          companyId,
        );
      } else if (dto.status === PeriodStatus.LOCKED) {
        await this.notificationsService.notifyPeriodLocked(
          id,
          period.name,
          companyId,
        );
      }
    }

    return result;
  }

  /** 锁定考核周期 */
  async lockPeriod(id: string, companyId: string) {
    return this.updatePeriod(id, { status: PeriodStatus.LOCKED }, companyId);
  }

  /** 激活考核周期 */
  async activatePeriod(id: string, companyId: string) {
    return this.updatePeriod(id, { status: PeriodStatus.ACTIVE }, companyId);
  }

  /** 删除考核周期（仅允许删除DRAFT状态的周期） */
  async deletePeriod(id: string, companyId: string) {
    const period = await this.prisma.assessmentPeriod.findFirst({
      where: { id, companyId },
    });
    if (!period) throw new NotFoundException('考核周期不存在');

    if (period.status !== PeriodStatus.DRAFT) {
      throw new BadRequestException('仅可删除草稿状态的考核周期');
    }

    const [assignmentCount, submissionCount] = await Promise.all([
      // 检查是否有关联数据
      this.prisma.kPIAssignment.count({ where: { periodId: id } }),
      this.prisma.dataSubmission.count({ where: { periodId: id } }),
    ]);

    if (assignmentCount > 0 || submissionCount > 0) {
      throw new BadRequestException(
        `该周期存在 ${assignmentCount} 个指标分配和 ${submissionCount} 个数据提交，无法删除`,
      );
    }

    await this.prisma.assessmentPeriod.delete({ where: { id } });
    return { message: '考核周期已删除' };
  }

  // ==================== Submission 数据提交 ====================

  /** 查询提交列表 */
  async findSubmissions(periodId: string, companyId: string) {
    const submissions = await this.prisma.dataSubmission.findMany({
      where: { companyId, ...(periodId && { periodId }) },
      include: {
        period: { select: { name: true } },
        _count: { select: { dataEntries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    // 获取用户信息
    const userIds = [
      ...new Set(submissions.flatMap(s => [s.submittedById, s.approvedById].filter(Boolean))),
    ] as string[];
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, username: true },
        })
      : [];
    const userMap = new Map(users.map(u => [u.id, u]));
    return submissions.map(s => ({
      ...s,
      submittedBy: s.submittedById ? userMap.get(s.submittedById) : null,
      approvedBy: s.approvedById ? userMap.get(s.approvedById) : null,
    }));
  }

  /** 创建数据提交 */
  async createSubmission(
    dto: CreateSubmissionDto,
    companyId: string,
    userId: string,
  ) {
    const period = await this.prisma.assessmentPeriod.findFirst({
      where: { id: dto.periodId, companyId },
    });

    if (!period) throw new NotFoundException('考核周期不存在');
    if (period.status === PeriodStatus.LOCKED) {
      throw new BadRequestException('考核周期已锁定，无法提交数据');
    }

    const lastSubmission = await this.prisma.dataSubmission.findFirst({
      // 获取最新版本号
      where: {
        periodId: dto.periodId,
        companyId,
        departmentId: dto.departmentId,
      },
      orderBy: { version: 'desc' },
    });

    return this.prisma.dataSubmission.create({
      data: {
        ...dto,
        companyId,
        version: (lastSubmission?.version || 0) + 1,
        submittedById: userId,
      },
    });
  }

  /** 提交审批 */
  async submitForApproval(
    submissionId: string,
    companyId: string,
    userId: string,
  ) {
    const submission = await this.prisma.dataSubmission.findFirst({
      where: { id: submissionId, companyId },
      include: { dataEntries: true },
    });

    if (!submission) throw new NotFoundException('提交记录不存在');

    if (submission.dataEntries.length === 0) {
      throw new BadRequestException('请先录入数据再提交');
    }

    const result = await this.prisma.dataSubmission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.PENDING,
        submittedAt: new Date(),
        submittedById: userId,
      },
    });

    // 获取提交者信息并发送通知
    const submitter = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    await this.notificationsService.notifySubmissionPending(
      submissionId,
      companyId,
      submitter?.username || '用户',
    );

    return result;
  }

  /** 审批通过 */
  async approveSubmission(
    submissionId: string,
    companyId: string,
    approverUserId: string,
  ) {
    const submission = await this.prisma.dataSubmission.findFirst({
      where: { id: submissionId, companyId, status: SubmissionStatus.PENDING },
    });

    if (!submission) throw new NotFoundException('待审批提交不存在');

    const result = await this.prisma.dataSubmission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.APPROVED,
        approvedAt: new Date(),
        approvedById: approverUserId,
      },
    });

    // 通知提交者
    if (submission.submittedById) {
      await this.notificationsService.notifySubmissionApproved(
        submissionId,
        submission.submittedById,
        companyId,
      );
    }

    return result;
  }

  /** 驳回提交 */
  async rejectSubmission(
    submissionId: string,
    reason: string,
    companyId: string,
    approverUserId: string,
  ) {
    const submission = await this.prisma.dataSubmission.findFirst({
      where: { id: submissionId, companyId, status: SubmissionStatus.PENDING },
    });

    if (!submission) throw new NotFoundException('待审批提交不存在');

    const result = await this.prisma.dataSubmission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.REJECTED,
        rejectReason: reason,
        approvedById: approverUserId,
      },
    });

    // 通知提交者
    if (submission.submittedById) {
      await this.notificationsService.notifySubmissionRejected(
        submissionId,
        submission.submittedById,
        companyId,
        reason,
      );
    }

    return result;
  }

  // ==================== Data Entry 数据录入 ====================

  /** 批量录入数据 */
  async bulkCreateEntries(
    submissionId: string,
    entries: DataEntryDto[],
    companyId: string,
  ) {
    const submission = await this.prisma.dataSubmission.findFirst({
      where: { id: submissionId, companyId, status: SubmissionStatus.DRAFT },
    });

    if (!submission) throw new NotFoundException('提交记录不存在或已提交审批');

    const results = await this.prisma.kPIDataEntry.createMany({
      data: entries.map((e) => ({
        submissionId,
        assignmentId: e.assignmentId,
        employeeId: e.employeeId,
        actualValue: e.actualValue,
        remark: e.remark,
      })),
      skipDuplicates: true, // 跳过重复
    });

    return { created: results.count };
  }

  /** 更新单条数据 */
  async updateEntry(
    entryId: string,
    actualValue: number,
    remark?: string,
    companyId?: string,
  ) {
    const entry = await this.prisma.kPIDataEntry.findFirst({
      where: { id: entryId },
      include: { submission: true },
    });

    if (!entry) throw new NotFoundException('数据条目不存在');

    if (companyId && entry.submission.companyId !== companyId) {
      throw new BadRequestException('无权修改此数据'); // 租户隔离验证
    }

    if (entry.submission.status !== SubmissionStatus.DRAFT) {
      throw new BadRequestException('仅可修改草稿状态的数据');
    }

    return this.prisma.kPIDataEntry.update({
      where: { id: entryId },
      data: { actualValue, remark },
    });
  }

  /** 获取提交的数据明细 */
  async getSubmissionEntries(submissionId: string, companyId: string) {
    return this.prisma.dataSubmission.findFirst({
      where: { id: submissionId, companyId },
      include: {
        dataEntries: {
          include: { assignment: { include: { kpiDefinition: true } } },
        },
        period: true,
      },
    });
  }

  /** 验证周期状态转换是否合法 */
  private async validateStatusTransition(
    periodId: string,
    currentStatus: PeriodStatus,
    newStatus: PeriodStatus,
    companyId: string,
  ) {
    if (currentStatus === PeriodStatus.DRAFT && newStatus === PeriodStatus.ACTIVE) {
      const assignmentCount = await this.prisma.kPIAssignment.count({
        where: { periodId, companyId },
      });
      if (assignmentCount === 0) {
        throw new BadRequestException('无法激活：该周期尚未分配任何KPI指标');
      }
    }

    if (currentStatus === PeriodStatus.ACTIVE && newStatus === PeriodStatus.LOCKED) {
      const approvedCount = await this.prisma.dataSubmission.count({
        where: { periodId, companyId, status: SubmissionStatus.APPROVED },
      });
      if (approvedCount === 0) {
        throw new BadRequestException('无法锁定：该周期尚无已审批的数据提交');
      }
    }

    if (newStatus === PeriodStatus.ARCHIVED && currentStatus !== PeriodStatus.LOCKED) {
      throw new BadRequestException('仅可归档已锁定的周期');
    }
  }
}
