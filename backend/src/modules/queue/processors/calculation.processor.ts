import { Processor, Process, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';

export interface CalculationJobData {
    periodId: string;
    companyId: string;
    departmentId?: string; // 可选，仅计算特定部门
    userId: string; // 触发计算的用户
}

@Processor('kpi-calculation')
export class CalculationProcessor {
    private readonly logger = new Logger(CalculationProcessor.name);

    @Process()
    async handleCalculation(job: Job<CalculationJobData>) {
        this.logger.log(`Processing KPI calculation job ${job.id}`);

        try {
            await job.progress(10); // 加载指标配置

            // TODO: 获取考核周期内的所有数据
            await job.progress(20);

            // TODO: 逐个员工计算KPI得分
            await job.progress(50);

            // TODO: 汇总部门得分
            await job.progress(70);

            // TODO: 汇总工厂/公司得分
            await job.progress(90);

            // TODO: 保存计算结果
            await job.progress(100);

            return { success: true, calculatedCount: 0 };
        } catch (error) {
            this.logger.error(`Calculation job ${job.id} failed:`, error);
            throw error;
        }
    }

    @OnQueueCompleted()
    onCompleted(job: Job) {
        this.logger.log(`Calculation job ${job.id} completed`);
    }

    @OnQueueFailed()
    onFailed(job: Job, error: Error) {
        this.logger.error(`Calculation job ${job.id} failed: ${error.message}`);
    }
}
