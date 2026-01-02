import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  FormulaEngine,
  CalculationInput,
  CalculationResult,
} from './engines/formula.engine';
import {
  RollupEngine,
  IndividualScore,
  RollupMethod,
} from './engines/rollup.engine';
import {
  FormulaType,
  PeriodStatus,
  SubmissionStatus,
  KPIStatusEnum,
} from '@prisma/client';

export interface CalculationJobResult {
  periodId: string;
  employeeCount: number;
  departmentCount: number;
  totalTime: number;
}

@Injectable()
export class CalculationService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private formulaEngine: FormulaEngine,
    private rollupEngine: RollupEngine,
    @InjectQueue('kpi-calculation') private calculationQueue: Queue,
  ) {}

  /** 触发异步计算任务 */
  async triggerCalculation(
    periodId: string,
    companyId: string,
    userId: string,
  ) {
    const period = await this.validateCalculationAllowed(periodId, companyId); // 验证是否允许计算

    const approvedSubmissions = await this.prisma.dataSubmission.count({
      where: { periodId, companyId, status: SubmissionStatus.APPROVED },
    });

    if (approvedSubmissions === 0) {
      throw new BadRequestException('没有已审批的数据提交，无法计算');
    }

    const job = await this.calculationQueue.add({
      periodId,
      companyId,
      userId,
    }); // 添加到队列

    return { jobId: job.id, message: '计算任务已加入队列' };
  }

  /** 验证是否允许执行计算（计算冻结逻辑） */
  private async validateCalculationAllowed(
    periodId: string,
    companyId: string,
  ) {
    const period = await this.prisma.assessmentPeriod.findFirst({
      where: { id: periodId, companyId },
    });

    if (!period) throw new NotFoundException('考核周期不存在');

    if (period.lockDate && new Date() > period.lockDate) {
      // 检查是否已过锁定日期
      throw new BadRequestException(
        `考核周期已于 ${period.lockDate.toLocaleDateString('zh-CN')} 锁定，无法重新计算`,
      );
    }

    return period;
  }

  /** 批量获取员工在考核期第一天的归属部门（优化N+1） */
  private async batchGetLockedDepartments(
    employeeIds: string[],
    periodStartDate: Date,
    companyId: string,
  ): Promise<Map<string, { deptId: string | null; deptName: string | null }>> {
    const result = new Map<
      string,
      { deptId: string | null; deptName: string | null }
    >();
    if (employeeIds.length === 0) return result;

    // 批量查询历史记录
    const histories = await this.prisma.employeeDepartmentHistory.findMany({
      where: {
        employeeId: { in: employeeIds },
        companyId,
        effectiveDate: { lte: periodStartDate },
        OR: [{ endDate: null }, { endDate: { gte: periodStartDate } }],
      },
      orderBy: { effectiveDate: 'desc' },
    });

    // 按员工分组取最新记录
    const historyMap = new Map<string, (typeof histories)[0]>();
    for (const h of histories) {
      if (!historyMap.has(h.employeeId)) historyMap.set(h.employeeId, h);
    }

    // 找出无历史记录的员工
    const noHistoryIds = employeeIds.filter((id) => !historyMap.has(id));

    // 批量查询员工当前部门
    const employees =
      noHistoryIds.length > 0
        ? await this.prisma.employee.findMany({
            where: { id: { in: noHistoryIds } },
            include: { department: true },
          })
        : [];
    const empMap = new Map(employees.map((e) => [e.id, e]));

    // 组装结果
    for (const empId of employeeIds) {
      const history = historyMap.get(empId);
      if (history) {
        result.set(empId, {
          deptId: history.departmentId,
          deptName: history.departmentName,
        });
      } else {
        const emp = empMap.get(empId);
        result.set(empId, {
          deptId: emp?.departmentId || null,
          deptName: emp?.department?.name || null,
        });
      }
    }

    return result;
  }

  /** 计算单条数据的得分 */
  private calculateEntryScore(entry: any): CalculationResult {
    const { assignment } = entry;
    const kpi = assignment.kpiDefinition;

    const input: CalculationInput = {
      actual: entry.actualValue,
      target: assignment.targetValue,
      challenge: assignment.challengeValue || undefined,
      weight: assignment.weight,
    };

    switch (kpi.formulaType) {
      case FormulaType.POSITIVE:
        return this.formulaEngine.calculatePositive(
          input,
          kpi.scoreCap,
          kpi.scoreFloor,
        );
      case FormulaType.NEGATIVE:
        return this.formulaEngine.calculateNegative(
          input,
          kpi.scoreCap,
          kpi.scoreFloor,
        );
      case FormulaType.BINARY:
        return this.formulaEngine.calculateBinary(
          entry.actualValue,
          assignment.weight,
          100,
        );
      case FormulaType.STEPPED:
        return this.formulaEngine.calculateStepped(
          entry.actualValue,
          (kpi.scoringRules as any[]) || [],
          assignment.weight,
        );
      case FormulaType.CUSTOM:
        return this.formulaEngine.calculateCustom(
          kpi.customFormula || '(actual / target) * 100',
          { actual: entry.actualValue, target: assignment.targetValue },
          assignment.weight,
          kpi.scoreCap,
          kpi.scoreFloor,
        );
      default:
        return this.formulaEngine.calculatePositive(
          input,
          kpi.scoreCap,
          kpi.scoreFloor,
        );
    }
  }

  /** 执行同步计算（用于小规模数据或测试） - 使用事务保护 */
  async executeCalculation(
    periodId: string,
    companyId: string,
    userId: string,
  ): Promise<CalculationJobResult> {
    const startTime = Date.now();

    const period = await this.validateCalculationAllowed(periodId, companyId);

    const entries = await this.prisma.kPIDataEntry.findMany({
      where: {
        submission: { periodId, companyId, status: SubmissionStatus.APPROVED },
      },
      include: { assignment: { include: { kpiDefinition: true } } },
    });

    // 第一步：计算所有得分（纯计算，无IO）
    const employeeScores = new Map<
      string,
      { scores: CalculationResult[]; departmentId?: string }
    >();
    const entryUpdates: {
      id: string;
      rawScore: number;
      cappedScore: number;
      weightedScore: number;
    }[] = [];

    for (const entry of entries) {
      const result = this.calculateEntryScore(entry);
      entryUpdates.push({
        id: entry.id,
        rawScore: result.rawScore,
        cappedScore: result.cappedScore,
        weightedScore: result.weightedScore,
      });

      const existing = employeeScores.get(entry.employeeId) || { scores: [] };
      existing.scores.push(result);
      existing.departmentId = entry.assignment.departmentId || undefined;
      employeeScores.set(entry.employeeId, existing);
    }

    // 第二步：批量获取归属部门（消除N+1）
    const employeeIds = [...employeeScores.keys()];
    const lockedDeptMap = await this.batchGetLockedDepartments(
      employeeIds,
      period.startDate,
      companyId,
    );

    // 第三步：批量获取员工信息（消除N+1）
    const employees =
      employeeIds.length > 0
        ? await this.prisma.employee.findMany({
            where: { id: { in: employeeIds } },
            select: { id: true, name: true },
          })
        : [];
    const empNameMap = new Map(employees.map((e) => [e.id, e.name]));

    // 第四步：准备员工绩效数据
    const individualScores: IndividualScore[] = [];
    const performanceOps: any[] = [];

    for (const [employeeId, data] of employeeScores) {
      const totalScore = this.formulaEngine.calculateTotalScore(data.scores);
      const status = this.formulaEngine.determineStatus(
        totalScore,
      ) as KPIStatusEnum;
      const lockedDept = lockedDeptMap.get(employeeId) || {
        deptId: null,
        deptName: null,
      };

      performanceOps.push(
        this.prisma.employeePerformance.upsert({
          where: { periodId_employeeId: { periodId, employeeId } },
          create: {
            periodId,
            employeeId,
            companyId,
            departmentId: data.departmentId,
            totalScore,
            status,
            lockedDeptId: lockedDept.deptId,
            lockedDeptName: lockedDept.deptName,
            calculatedById: userId,
          },
          update: {
            totalScore,
            status,
            lockedDeptId: lockedDept.deptId,
            lockedDeptName: lockedDept.deptName,
            calculatedAt: new Date(),
            calculatedById: userId,
          },
        }),
      );

      individualScores.push({
        employeeId,
        employeeName: empNameMap.get(employeeId) || 'Unknown',
        departmentId: lockedDept.deptId || data.departmentId || '',
        totalScore,
      });
    }

    // 第五步：准备部门绩效数据
    const grouped = this.rollupEngine.groupByDepartment(individualScores);
    const deptOps: any[] = [];

    for (const [departmentId, scores] of grouped) {
      const deptScore = this.rollupEngine.calculateDepartmentScore(
        scores,
        RollupMethod.AVERAGE,
      );
      deptOps.push(
        this.prisma.departmentPerformance.upsert({
          where: { periodId_departmentId: { periodId, departmentId } },
          create: {
            periodId,
            departmentId,
            companyId,
            totalScore: deptScore,
            employeeCount: scores.length,
            rollupMethod: RollupMethod.AVERAGE,
          },
          update: {
            totalScore: deptScore,
            employeeCount: scores.length,
            calculatedAt: new Date(),
          },
        }),
      );
    }

    // 第六步：使用事务批量执行所有数据库操作
    await this.prisma.$transaction([
      ...entryUpdates.map((u) =>
        this.prisma.kPIDataEntry.update({
          where: { id: u.id },
          data: {
            rawScore: u.rawScore,
            cappedScore: u.cappedScore,
            weightedScore: u.weightedScore,
          },
        }),
      ),
      ...performanceOps,
      ...deptOps,
    ]);

    // 发送通知（事务外执行，不影响计算结果）
    await this.notificationsService.notifyCalculationComplete(
      periodId,
      period.name,
      companyId,
      employeeScores.size,
    );

    return {
      periodId,
      employeeCount: employeeScores.size,
      departmentCount: grouped.size,
      totalTime: Date.now() - startTime,
    };
  }

  /** 获取周期计算结果 */
  async getPeriodResults(periodId: string, companyId: string) {
    const [employeeResults, departmentResults] = await Promise.all([
      this.prisma.employeePerformance.findMany({
        where: { periodId, companyId },
        orderBy: { totalScore: 'desc' },
      }),
      this.prisma.departmentPerformance.findMany({
        where: { periodId, companyId },
        orderBy: { totalScore: 'desc' },
      }),
    ]);

    return { employeeResults, departmentResults };
  }

  /** 获取任务状态 */
  async getJobStatus(jobId: string) {
    const job = await this.calculationQueue.getJob(jobId);
    if (!job) throw new NotFoundException('任务不存在');

    return {
      id: job.id,
      progress: await job.progress(),
      state: await job.getState(),
      result: job.returnvalue,
    };
  }
}
