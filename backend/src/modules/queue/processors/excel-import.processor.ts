import {
  Processor,
  Process,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ExcelTemplateService } from '../../assessment/services/excel-template.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { SubmissionStatus } from '@prisma/client';

export interface ExcelImportJobData {
  fileBuffer: string; // Base64 编码的文件内容
  companyId: string;
  userId: string;
  periodId: string;
  submissionId: string;
}

@Processor('excel-import')
export class ExcelImportProcessor {
  private readonly logger = new Logger(ExcelImportProcessor.name);

  constructor(
    private prisma: PrismaService,
    private excelTemplateService: ExcelTemplateService,
    private notificationsService: NotificationsService,
  ) {}

  @Process()
  async handleImport(job: Job<ExcelImportJobData>) {
    this.logger.log(`Processing Excel import job ${job.id}`);
    const { fileBuffer, periodId, companyId, submissionId } = job.data;

    try {
      await job.progress(10); // 开始解析

      const buffer = Buffer.from(fileBuffer, 'base64'); // 解码 Base64 文件
      await job.progress(20);

      const parseResult = await this.excelTemplateService.parseUploadedExcel(
        buffer,
        periodId,
        companyId,
      ); // 解析 Excel
      await job.progress(50);

      if (parseResult.errors.length > 0) {
        // 如果有错误，标记提交失败
        await this.prisma.dataSubmission.update({
          where: { id: submissionId },
          data: {
            status: SubmissionStatus.REJECTED,
            rejectReason: parseResult.errors.join('; '),
          },
        });
        return {
          success: false,
          errors: parseResult.errors,
          rowCount: parseResult.rowCount,
        };
      }

      const entries = parseResult.data.map((d) => ({
        // 批量写入数据
        submissionId,
        assignmentId: d.assignmentId,
        employeeId: d.employeeId,
        actualValue: d.actualValue,
      }));

      await this.prisma.kPIDataEntry.createMany({
        data: entries,
        skipDuplicates: true,
      });
      await job.progress(80);

      await this.prisma.dataSubmission.update({
        // 更新提交状态为待审批
        where: { id: submissionId },
        data: { status: SubmissionStatus.PENDING, submittedAt: new Date() },
      });
      await job.progress(100);

      const user = await this.prisma.user.findUnique({
        where: { id: job.data.userId },
      }); // 通知管理员审批
      await this.notificationsService.notifySubmissionPending(
        submissionId,
        companyId,
        user?.username || '用户',
      );

      return {
        success: true,
        rowCount: parseResult.rowCount,
        entryCount: entries.length,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Excel import job ${job.id} failed: ${errorMsg}`,
        error instanceof Error ? error.stack : '',
      );

      await this.prisma.dataSubmission.update({
        // 标记提交失败
        where: { id: submissionId },
        data: {
          status: SubmissionStatus.REJECTED,
          rejectReason: `导入失败: ${errorMsg}`,
        },
      });

      await this.notificationsService.send(
        {
          // 通知上传用户导入失败
          type: 'SUBMISSION_REJECTED' as any,
          title: 'Excel导入失败',
          content: `文件导入处理失败：${errorMsg}`,
          relatedType: 'submission',
          relatedId: submissionId,
          userId: job.data.userId,
        },
        companyId,
      );

      throw error;
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(
      `Job ${job.id} completed with result: ${JSON.stringify(job.returnvalue)}`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}
