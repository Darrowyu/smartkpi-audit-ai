import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { FormulaEngine, CalculationInput, CalculationResult } from './engines/formula.engine';
import { RollupEngine, IndividualScore, DepartmentScore, RollupMethod } from './engines/rollup.engine';
import { FormulaType, PeriodStatus, SubmissionStatus, KPIStatusEnum } from '@prisma/client';

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
        private formulaEngine: FormulaEngine,
        private rollupEngine: RollupEngine,
        @InjectQueue('kpi-calculation') private calculationQueue: Queue,
    ) { }

    /** 触发异步计算任务 */
    async triggerCalculation(periodId: string, companyId: string, userId: string) {
        const period = await this.prisma.assessmentPeriod.findFirst({
            where: { id: periodId, companyId },
        });

        if (!period) throw new NotFoundException('考核周期不存在');

        const approvedSubmissions = await this.prisma.dataSubmission.count({
            where: { periodId, companyId, status: SubmissionStatus.APPROVED },
        });

        if (approvedSubmissions === 0) {
            throw new BadRequestException('没有已审批的数据提交，无法计算');
        }

        const job = await this.calculationQueue.add({ // 添加到队列
            periodId,
            companyId,
            userId,
        });

        return { jobId: job.id, message: '计算任务已加入队列' };
    }

    /** 执行同步计算（用于小规模数据或测试） */
    async executeCalculation(periodId: string, companyId: string, userId: string): Promise<CalculationJobResult> {
        const startTime = Date.now();

        const entries = await this.prisma.kPIDataEntry.findMany({ // 获取所有已审批的数据
            where: {
                submission: { periodId, companyId, status: SubmissionStatus.APPROVED },
            },
            include: {
                assignment: { include: { kpiDefinition: true } },
            },
        });

        const employeeScores = new Map<string, { scores: CalculationResult[]; departmentId?: string }>(); // 按员工分组计算

        for (const entry of entries) {
            const { assignment } = entry;
            const kpi = assignment.kpiDefinition;

            const input: CalculationInput = { // 计算单项得分
                actual: entry.actualValue,
                target: assignment.targetValue,
                challenge: assignment.challengeValue || undefined,
                weight: assignment.weight,
            };

            let result: CalculationResult;

            switch (kpi.formulaType) {
                case FormulaType.POSITIVE:
                    result = this.formulaEngine.calculatePositive(input, kpi.scoreCap, kpi.scoreFloor);
                    break;
                case FormulaType.NEGATIVE:
                    result = this.formulaEngine.calculateNegative(input, kpi.scoreCap, kpi.scoreFloor);
                    break;
                case FormulaType.BINARY:
                    result = this.formulaEngine.calculateBinary(entry.actualValue, assignment.weight, 100);
                    break;
                case FormulaType.STEPPED:
                    const steps = kpi.scoringRules as any[] || [];
                    result = this.formulaEngine.calculateStepped(entry.actualValue, steps, assignment.weight);
                    break;
                case FormulaType.CUSTOM:
                    result = this.formulaEngine.calculateCustom(
                        kpi.customFormula || '(actual / target) * 100',
                        { actual: entry.actualValue, target: assignment.targetValue },
                        assignment.weight,
                        kpi.scoreCap,
                        kpi.scoreFloor,
                    );
                    break;
                default:
                    result = this.formulaEngine.calculatePositive(input, kpi.scoreCap, kpi.scoreFloor);
            }

            await this.prisma.kPIDataEntry.update({ // 更新数据条目的得分
                where: { id: entry.id },
                data: {
                    rawScore: result.rawScore,
                    cappedScore: result.cappedScore,
                    weightedScore: result.weightedScore,
                },
            });

            const existing = employeeScores.get(entry.employeeId) || { scores: [] }; // 累计员工得分
            existing.scores.push(result);
            existing.departmentId = assignment.departmentId || undefined;
            employeeScores.set(entry.employeeId, existing);
        }

        const individualScores: IndividualScore[] = []; // 计算员工总分并保存

        for (const [employeeId, data] of employeeScores) {
            const totalScore = this.formulaEngine.calculateTotalScore(data.scores);
            const status = this.formulaEngine.determineStatus(totalScore) as KPIStatusEnum;

            await this.prisma.employeePerformance.upsert({
                where: { periodId_employeeId: { periodId, employeeId } },
                create: {
                    periodId,
                    employeeId,
                    companyId,
                    departmentId: data.departmentId,
                    totalScore,
                    status,
                    calculatedById: userId,
                },
                update: {
                    totalScore,
                    status,
                    calculatedAt: new Date(),
                    calculatedById: userId,
                },
            });

            const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });

            individualScores.push({
                employeeId,
                employeeName: employee?.name || 'Unknown',
                departmentId: data.departmentId || '',
                totalScore,
            });
        }

        const grouped = this.rollupEngine.groupByDepartment(individualScores); // 计算部门绩效

        for (const [departmentId, scores] of grouped) {
            const deptScore = this.rollupEngine.calculateDepartmentScore(scores, RollupMethod.AVERAGE);

            await this.prisma.departmentPerformance.upsert({
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
            });
        }

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
