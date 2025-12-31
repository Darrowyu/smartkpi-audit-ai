import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  BulkAssignmentDto,
  QueryAssignmentDto,
} from '../dto/assignment.dto';
import { PeriodStatus } from '@prisma/client';

@Injectable()
export class AssignmentService {
  constructor(private prisma: PrismaService) {}

  /** 创建单个指标分配 - 使用事务防止竞态条件 */
  async create(dto: CreateAssignmentDto, companyId: string) {
    await this.validatePeriodNotLocked(dto.periodId, companyId);
    await this.validateKPIExists(dto.kpiDefinitionId, companyId);

    if (dto.departmentId && dto.employeeId) {
      throw new BadRequestException('部门分配和个人分配不能同时指定');
    }

    // 使用事务确保权重校验和创建的原子性
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.kPIAssignment.findFirst({
        where: {
          periodId: dto.periodId,
          kpiDefinitionId: dto.kpiDefinitionId,
          departmentId: dto.departmentId || null,
          employeeId: dto.employeeId || null,
        },
      });

      if (existing) {
        throw new ConflictException('该指标已分配给此对象');
      }

      const kpi = await tx.kPIDefinition.findUnique({ where: { id: dto.kpiDefinitionId } });
      const newWeight = dto.weight ?? kpi?.defaultWeight ?? 10;

      // 在事务内校验权重（防止并发问题）
      await this.validateWeightSumInTx(tx, dto.periodId, dto.departmentId, dto.employeeId, newWeight, companyId);

      return tx.kPIAssignment.create({
        data: {
          kpiDefinitionId: dto.kpiDefinitionId,
          periodId: dto.periodId,
          companyId,
          departmentId: dto.departmentId,
          employeeId: dto.employeeId,
          targetValue: dto.targetValue,
          challengeValue: dto.challengeValue,
          weight: newWeight,
        },
        include: { kpiDefinition: true },
      });
    });
  }

  /** 批量创建指标分配 */
  async bulkCreate(dto: BulkAssignmentDto, companyId: string) {
    await this.validatePeriodNotLocked(dto.periodId, companyId);

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const item of dto.assignments) {
      try {
        await this.create({ ...item, periodId: dto.periodId }, companyId);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${item.kpiDefinitionId}: ${error.message}`);
      }
    }

    return results;
  }

  /** 获取指标分配列表 */
  async findAll(query: QueryAssignmentDto, companyId: string) {
    const { periodId, departmentId, employeeId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where = {
      companyId,
      ...(periodId && { periodId }),
      ...(departmentId && { departmentId }),
      ...(employeeId && { employeeId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.kPIAssignment.findMany({
        where,
        skip,
        take: limit,
        include: {
          kpiDefinition: true,
          period: { select: { id: true, name: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.kPIAssignment.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** 获取周期内所有分配（用于模板生成） */
  async findByPeriod(periodId: string, companyId: string) {
    return this.prisma.kPIAssignment.findMany({
      where: { periodId, companyId },
      include: { kpiDefinition: true },
      orderBy: { kpiDefinition: { code: 'asc' } },
    });
  }

  /** 更新指标分配 */
  async update(id: string, dto: UpdateAssignmentDto, companyId: string) {
    const assignment = await this.prisma.kPIAssignment.findFirst({
      where: { id, companyId },
      include: { period: true },
    });

    if (!assignment) throw new NotFoundException('指标分配不存在');

    if (assignment.period.status === PeriodStatus.LOCKED) {
      throw new BadRequestException('考核周期已锁定，无法修改分配');
    }

    if (dto.weight !== undefined && dto.weight !== assignment.weight) {
      const weightDiff = dto.weight - assignment.weight; // 计算权重差值
      await this.validateWeightSum(
        assignment.periodId,
        assignment.departmentId || undefined,
        assignment.employeeId || undefined,
        weightDiff,
        companyId,
        id,
      );
    }

    return this.prisma.kPIAssignment.update({
      where: { id },
      data: dto,
      include: { kpiDefinition: true },
    });
  }

  /** 删除指标分配 */
  async remove(id: string, companyId: string) {
    const assignment = await this.prisma.kPIAssignment.findFirst({
      where: { id, companyId },
      include: { period: true },
    });

    if (!assignment) throw new NotFoundException('指标分配不存在');

    if (assignment.period.status === PeriodStatus.LOCKED) {
      throw new BadRequestException('考核周期已锁定，无法删除分配');
    }

    await this.prisma.kPIAssignment.delete({ where: { id } });
    return { message: '删除成功' };
  }

  /** 复制上一周期的分配到新周期 */
  async copyFromPeriod(
    sourcePeriodId: string,
    targetPeriodId: string,
    companyId: string,
  ) {
    await this.validatePeriodNotLocked(targetPeriodId, companyId);

    const sourceAssignments = await this.prisma.kPIAssignment.findMany({
      where: { periodId: sourcePeriodId, companyId },
    });

    if (sourceAssignments.length === 0) {
      throw new BadRequestException('源周期没有指标分配');
    }

    const created = await this.prisma.kPIAssignment.createMany({
      data: sourceAssignments.map((a) => ({
        kpiDefinitionId: a.kpiDefinitionId,
        periodId: targetPeriodId,
        companyId,
        departmentId: a.departmentId,
        employeeId: a.employeeId,
        targetValue: a.targetValue,
        challengeValue: a.challengeValue,
        weight: a.weight,
      })),
      skipDuplicates: true,
    });

    return { copied: created.count, message: `已复制 ${created.count} 条分配` };
  }

  /** 获取部门的指标分配汇总 */
  async getDepartmentAssignments(periodId: string, companyId: string) {
    const departments = await this.prisma.department.findMany({
      where: { companyId, isActive: true },
    });

    const assignments = await this.prisma.kPIAssignment.findMany({
      where: { periodId, companyId },
      include: { kpiDefinition: true },
    });

    return departments.map((dept) => ({
      departmentId: dept.id,
      departmentName: dept.name,
      assignments: assignments.filter(
        (a) => a.departmentId === dept.id || !a.departmentId,
      ), // 部门级 + 公司级
      totalWeight: assignments
        .filter((a) => a.departmentId === dept.id || !a.departmentId)
        .reduce((sum, a) => sum + a.weight, 0),
    }));
  }

  private async validatePeriodNotLocked(periodId: string, companyId: string) {
    const period = await this.prisma.assessmentPeriod.findFirst({
      where: { id: periodId, companyId },
    });

    if (!period) throw new NotFoundException('考核周期不存在');

    if (
      period.status === PeriodStatus.LOCKED ||
      period.status === PeriodStatus.ARCHIVED
    ) {
      throw new BadRequestException('考核周期已锁定或归档，无法修改分配');
    }
  }

  private async validateKPIExists(kpiId: string, companyId: string) {
    const kpi = await this.prisma.kPIDefinition.findFirst({
      where: { id: kpiId, OR: [{ companyId }, { isGlobal: true }] },
    });

    if (!kpi) throw new NotFoundException('KPI指标不存在');
  }

  /** 校验同一对象（部门/员工）的权重总和是否超过100% */
  private async validateWeightSum(
    periodId: string,
    departmentId: string | undefined,
    employeeId: string | undefined,
    newWeight: number,
    companyId: string,
    excludeId?: string,
  ) {
    return this.validateWeightSumInTx(this.prisma, periodId, departmentId, employeeId, newWeight, companyId, excludeId);
  }

  /** 事务内校验权重总和（防止竞态条件） */
  private async validateWeightSumInTx(
    tx: any,
    periodId: string,
    departmentId: string | undefined,
    employeeId: string | undefined,
    newWeight: number,
    companyId: string,
    excludeId?: string,
  ) {
    const where: any = { periodId, companyId };

    if (employeeId) {
      where.employeeId = employeeId;
    } else if (departmentId) {
      where.departmentId = departmentId;
      where.employeeId = null;
    } else {
      where.departmentId = null;
      where.employeeId = null;
    }

    if (excludeId) where.NOT = { id: excludeId };

    const existingAssignments = await tx.kPIAssignment.findMany({ where, select: { weight: true } });
    const currentSum = existingAssignments.reduce((sum: number, a: any) => sum + a.weight, 0);
    const totalWeight = currentSum + newWeight;

    if (totalWeight > 100) {
      const target = employeeId ? '该员工' : departmentId ? '该部门' : '公司级';
      throw new BadRequestException(`${target}权重总和将达到 ${totalWeight}%，超过100%上限（当前已分配 ${currentSum}%）`);
    }
  }
}
