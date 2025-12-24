import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import {
  GeminiClientService,
  KPIAnalysisResult,
} from './services/gemini-client.service';
import { FileProcessStatus, KPIStatusEnum } from '@prisma/client';

@Injectable()
export class KpiAnalysisService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
    private geminiClient: GeminiClientService,
  ) {}

  /** 触发上传文件的KPI分析 */
  async analyzeFile(
    fileId: string,
    companyId: string,
    userId: string,
    language: 'en' | 'zh' = 'en',
    userPeriod?: string,
  ) {
    const file = await this.prisma.uploadedFile.findFirst({
      // 获取文件（租户隔离）
      where: { id: fileId, companyId },
    });

    if (!file) throw new NotFoundException('File not found');
    if (file.status !== FileProcessStatus.COMPLETED) {
      throw new BadRequestException('File is not ready for analysis');
    }

    const parsedData = file.parsedData as { csv?: string } | null; // 从解析数据获取CSV
    if (!parsedData?.csv)
      throw new BadRequestException('File has no parsed data');

    const result = await this.geminiClient.analyzeKPIData(
      parsedData.csv,
      language,
    ); // 调用Gemini AI分析

    // 使用用户指定的周期，否则使用AI推断的周期
    const period = userPeriod || result.period;

    const analysis = await this.prisma.$transaction(async (tx) => {
      // 保存分析到数据库
      const kpiAnalysis = await tx.kPIAnalysis.create({
        // 创建主分析记录
        data: {
          summary: result.summary,
          period: period,
          rawResult: result as any,
          fileId,
          companyId,
          analyzedById: userId,
        },
      });

      if (result.employees?.length > 0) {
        // 创建员工记录用于查询
        await tx.kPIEmployeeRecord.createMany({
          data: result.employees.map((emp) => ({
            employeeName: emp.name,
            department: emp.department,
            role: emp.role,
            totalScore: emp.totalScore,
            status: this.mapStatus(emp.status),
            aiAnalysis: emp.aiAnalysis,
            metrics: emp.metrics as any,
            analysisId: kpiAnalysis.id,
            companyId,
          })),
        });
      }

      return kpiAnalysis;
    });

    return this.getAnalysisById(analysis.id, companyId);
  }

  /** 获取分析列表（分页，租户隔离） */
  async getAnalyses(companyId: string, page = 1, limit = 10, period?: string) {
    const skip = (page - 1) * limit;
    const where = {
      companyId,
      ...(period && { period: { contains: period } }),
    };

    const [analyses, total] = await Promise.all([
      this.prisma.kPIAnalysis.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          summary: true,
          period: true,
          createdAt: true,
          file: { select: { id: true, originalName: true } },
          analyzedBy: { select: { id: true, email: true, firstName: true } },
          _count: { select: { employeeRecords: true } },
        },
      }),
      this.prisma.kPIAnalysis.count({ where }),
    ]);

    return {
      data: analyses,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** 按ID获取单个分析（租户隔离） */
  async getAnalysisById(analysisId: string, companyId: string) {
    const analysis = await this.prisma.kPIAnalysis.findFirst({
      where: { id: analysisId, companyId },
      include: {
        file: { select: { id: true, originalName: true, createdAt: true } },
        analyzedBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        employeeRecords: { orderBy: { totalScore: 'desc' } },
      },
    });

    if (!analysis) throw new NotFoundException('Analysis not found');
    return analysis;
  }

  /** 删除分析（租户隔离） */
  async deleteAnalysis(analysisId: string, companyId: string) {
    const analysis = await this.prisma.kPIAnalysis.findFirst({
      where: { id: analysisId, companyId },
    });

    if (!analysis) throw new NotFoundException('Analysis not found');

    await this.prisma.kPIAnalysis.delete({ where: { id: analysisId } });
    return { message: 'Analysis deleted successfully' };
  }

  /** 将状态字符串映射为枚举 */
  private mapStatus(status: string): KPIStatusEnum {
    const map: Record<string, KPIStatusEnum> = {
      Excellent: KPIStatusEnum.EXCELLENT,
      Good: KPIStatusEnum.GOOD,
      Average: KPIStatusEnum.AVERAGE,
      Poor: KPIStatusEnum.POOR,
    };
    return map[status] || KPIStatusEnum.AVERAGE;
  }
}
