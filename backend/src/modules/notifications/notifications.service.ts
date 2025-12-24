import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import {
  CreateNotificationDto,
  QueryNotificationDto,
  BulkNotificationDto,
  NotificationTypeEnum,
} from './dto/notification.dto';

export interface NotificationPayload {
  type: NotificationTypeEnum;
  title: string;
  content: string;
  relatedType?: string;
  relatedId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /** 发送单个通知 */
  async send(dto: CreateNotificationDto, companyId: string) {
    return this.prisma.notification.create({
      data: {
        type: dto.type,
        title: dto.title,
        content: dto.content,
        relatedType: dto.relatedType,
        relatedId: dto.relatedId,
        userId: dto.userId,
        companyId,
      },
    });
  }

  /** 批量发送通知 */
  async sendBulk(dto: BulkNotificationDto, companyId: string) {
    const notifications = dto.userIds.map((userId) => ({
      type: dto.type,
      title: dto.title,
      content: dto.content,
      relatedType: dto.relatedType,
      relatedId: dto.relatedId,
      userId,
      companyId,
    }));

    const result = await this.prisma.notification.createMany({
      data: notifications,
    });

    return { sent: result.count };
  }

  /** 发送给公司所有用户 */
  async sendToCompany(payload: NotificationPayload, companyId: string) {
    const users = await this.prisma.user.findMany({
      where: { companyId, isActive: true },
      select: { id: true },
    });

    return this.sendBulk(
      { ...payload, userIds: users.map((u) => u.id) },
      companyId,
    );
  }

  /** 发送给特定角色的用户 */
  async sendToRole(
    payload: NotificationPayload,
    companyId: string,
    roles: UserRole[],
  ) {
    const users = await this.prisma.user.findMany({
      where: { companyId, isActive: true, role: { in: roles } },
      select: { id: true },
    });

    if (users.length === 0) return { sent: 0 };

    return this.sendBulk(
      { ...payload, userIds: users.map((u) => u.id) },
      companyId,
    );
  }

  /** 发送给部门用户 */
  async sendToDepartment(
    payload: NotificationPayload,
    companyId: string,
    departmentId: string,
  ) {
    const users = await this.prisma.user.findMany({
      where: { companyId, departmentId, isActive: true },
      select: { id: true },
    });

    if (users.length === 0) return { sent: 0 };

    return this.sendBulk(
      { ...payload, userIds: users.map((u) => u.id) },
      companyId,
    );
  }

  /** 获取用户通知列表 */
  async findAll(userId: string, query: QueryNotificationDto) {
    const { type, isRead, page = '1', limit = '20' } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      userId,
      ...(type && { type }),
      ...(typeof isRead === 'boolean' && { isRead }),
    };

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        unreadCount,
      },
    };
  }

  /** 获取未读数量 */
  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /** 标记单个为已读 */
  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /** 标记全部为已读 */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /** 删除单个通知 */
  async remove(id: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: { id, userId },
    });
  }

  /** 删除所有已读通知 */
  async removeAllRead(userId: string) {
    return this.prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
  }

  // ==================== 业务场景通知方法 ====================

  /** 通知：数据提交待审批 */
  async notifySubmissionPending(
    submissionId: string,
    companyId: string,
    submitterName: string,
  ) {
    return this.sendToRole(
      {
        type: NotificationTypeEnum.SUBMISSION_PENDING,
        title: '新的数据提交待审批',
        content: `${submitterName} 提交了绩效数据，等待您的审批`,
        relatedType: 'submission',
        relatedId: submissionId,
      },
      companyId,
      [UserRole.GROUP_ADMIN, UserRole.MANAGER],
    );
  }

  /** 通知：数据提交已通过 */
  async notifySubmissionApproved(
    submissionId: string,
    userId: string,
    companyId: string,
  ) {
    return this.send(
      {
        type: NotificationTypeEnum.SUBMISSION_APPROVED,
        title: '数据提交已通过',
        content: '您提交的绩效数据已审批通过',
        relatedType: 'submission',
        relatedId: submissionId,
        userId,
      },
      companyId,
    );
  }

  /** 通知：数据提交被驳回 */
  async notifySubmissionRejected(
    submissionId: string,
    userId: string,
    companyId: string,
    reason: string,
  ) {
    return this.send(
      {
        type: NotificationTypeEnum.SUBMISSION_REJECTED,
        title: '数据提交被驳回',
        content: `您提交的绩效数据被驳回，原因：${reason}`,
        relatedType: 'submission',
        relatedId: submissionId,
        userId,
      },
      companyId,
    );
  }

  /** 通知：绩效计算完成 */
  async notifyCalculationComplete(
    periodId: string,
    periodName: string,
    companyId: string,
    employeeCount: number,
  ) {
    return this.sendToRole(
      {
        type: NotificationTypeEnum.CALCULATION_COMPLETE,
        title: '绩效计算完成',
        content: `${periodName} 的绩效计算已完成，共计算 ${employeeCount} 名员工`,
        relatedType: 'period',
        relatedId: periodId,
      },
      companyId,
      [UserRole.GROUP_ADMIN, UserRole.MANAGER],
    );
  }

  /** 通知：考核周期已激活 */
  async notifyPeriodActivated(
    periodId: string,
    periodName: string,
    companyId: string,
  ) {
    return this.sendToCompany(
      {
        type: NotificationTypeEnum.PERIOD_ACTIVATED,
        title: '新考核周期已开始',
        content: `考核周期"${periodName}"已激活，请及时填报数据`,
        relatedType: 'period',
        relatedId: periodId,
      },
      companyId,
    );
  }

  /** 通知：考核周期已锁定 */
  async notifyPeriodLocked(
    periodId: string,
    periodName: string,
    companyId: string,
  ) {
    return this.sendToCompany(
      {
        type: NotificationTypeEnum.PERIOD_LOCKED,
        title: '考核周期已锁定',
        content: `考核周期"${periodName}"已锁定，数据不可再修改`,
        relatedType: 'period',
        relatedId: periodId,
      },
      companyId,
    );
  }

  /** 通知：低绩效预警 */
  async notifyLowPerformance(
    employeeId: string,
    employeeName: string,
    score: number,
    userId: string,
    companyId: string,
  ) {
    return this.send(
      {
        type: NotificationTypeEnum.LOW_PERFORMANCE_ALERT,
        title: '低绩效预警',
        content: `员工 ${employeeName} 绩效得分 ${score} 分，低于预警阈值，请关注`,
        relatedType: 'employee',
        relatedId: employeeId,
        userId,
      },
      companyId,
    );
  }

  /** 通知：新指标分配 */
  async notifyAssignmentCreated(
    periodName: string,
    kpiName: string,
    userId: string,
    companyId: string,
  ) {
    return this.send(
      {
        type: NotificationTypeEnum.ASSIGNMENT_CREATED,
        title: '新指标已分配',
        content: `您在"${periodName}"被分配了新指标：${kpiName}`,
        userId,
      },
      companyId,
    );
  }
}
