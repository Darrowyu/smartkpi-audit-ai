import {
  Processor,
  Process,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { CalculationService } from '../../calculation/calculation.service';

export interface CalculationJobData {
  periodId: string;
  companyId: string;
  departmentId?: string; // 可选，仅计算特定部门
  userId: string; // 触发计算的用户
}

@Processor('kpi-calculation')
export class CalculationProcessor {
  private readonly logger = new Logger(CalculationProcessor.name);

  constructor(private calculationService: CalculationService) {}

  @Process()
  async handleCalculation(job: Job<CalculationJobData>) {
    const { periodId, companyId, userId } = job.data;
    this.logger.log(
      `Processing KPI calculation job ${job.id} for period ${periodId}`,
    );

    try {
      await job.progress(10); // 开始计算
      const result = await this.calculationService.executeCalculation(
        periodId,
        companyId,
        userId,
      ); // 执行完整计算
      await job.progress(100);

      this.logger.log(
        `Calculation complete: ${result.employeeCount} employees, ${result.departmentCount} departments in ${result.totalTime}ms`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Calculation job ${job.id} failed:`, error);
      throw error;
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(
      `Calculation job ${job.id} completed: ${JSON.stringify(job.returnvalue)}`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Calculation job ${job.id} failed: ${error.message}`);
  }
}
