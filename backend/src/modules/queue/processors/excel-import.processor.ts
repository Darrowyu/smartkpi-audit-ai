import { Processor, Process, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';

export interface ExcelImportJobData {
    fileId: string;
    companyId: string;
    userId: string;
    periodId: string;
    buffer: string; // Base64编码的文件内容
}

@Processor('excel-import')
export class ExcelImportProcessor {
    private readonly logger = new Logger(ExcelImportProcessor.name);

    @Process()
    async handleImport(job: Job<ExcelImportJobData>) {
        this.logger.log(`Processing Excel import job ${job.id}`);

        try {
            await job.progress(10); // 开始解析

            // TODO: 解析Excel文件
            await job.progress(30);

            // TODO: 校验数据格式
            await job.progress(50);

            // TODO: 保存数据到数据库
            await job.progress(80);

            // TODO: 触发计算任务
            await job.progress(100);

            return { success: true, rowCount: 0 };
        } catch (error) {
            this.logger.error(`Excel import job ${job.id} failed:`, error);
            throw error;
        }
    }

    @OnQueueCompleted()
    onCompleted(job: Job) {
        this.logger.log(`Job ${job.id} completed`);
    }

    @OnQueueFailed()
    onFailed(job: Job, error: Error) {
        this.logger.error(`Job ${job.id} failed: ${error.message}`);
    }
}
