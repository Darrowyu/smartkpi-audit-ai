import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DataSourceService {
  constructor(private prisma: PrismaService) {}

  async createDataSource(companyId: string, dto: { name: string; type: string; connectionConfig: Record<string, any>; fieldMapping: Record<string, any>; syncFrequency?: string }) {
    return this.prisma.dataSourceConfig.create({
      data: {
        companyId,
        name: dto.name,
        type: dto.type,
        connectionConfig: dto.connectionConfig,
        fieldMapping: dto.fieldMapping,
        syncFrequency: dto.syncFrequency || 'daily',
      },
    });
  }

  async getDataSources(companyId: string) {
    return this.prisma.dataSourceConfig.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDataSource(id: string) {
    const ds = await this.prisma.dataSourceConfig.findUnique({ where: { id } });
    if (!ds) throw new NotFoundException('数据源不存在');
    return ds;
  }

  async updateDataSource(id: string, dto: Partial<{ name: string; connectionConfig: Record<string, any>; fieldMapping: Record<string, any>; syncFrequency: string; isActive: boolean }>) {
    return this.prisma.dataSourceConfig.update({
      where: { id },
      data: dto,
    });
  }

  async deleteDataSource(id: string) {
    return this.prisma.dataSourceConfig.delete({ where: { id } });
  }

  async testConnection(id: string) {
    const ds = await this.getDataSource(id);
    // 模拟连接测试
    return { success: true, message: '连接测试成功' };
  }

  async triggerSync(id: string, companyId: string) {
    const ds = await this.getDataSource(id);

    const log = await this.prisma.dataSyncLog.create({
      data: {
        dataSourceId: id,
        companyId,
        startedAt: new Date(),
        status: 'running',
      },
    });

    // 模拟同步过程
    setTimeout(async () => {
      await this.prisma.dataSyncLog.update({
        where: { id: log.id },
        data: {
          completedAt: new Date(),
          status: 'success',
          recordsProcessed: Math.floor(Math.random() * 100) + 10,
        },
      });

      await this.prisma.dataSourceConfig.update({
        where: { id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'success',
        },
      });
    }, 2000);

    return { logId: log.id, message: '同步任务已启动' };
  }

  async getSyncLogs(companyId: string, dataSourceId?: string) {
    const where: any = { companyId };
    if (dataSourceId) where.dataSourceId = dataSourceId;

    return this.prisma.dataSyncLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getSyncStatus(logId: string) {
    const log = await this.prisma.dataSyncLog.findUnique({ where: { id: logId } });
    if (!log) throw new NotFoundException('同步日志不存在');
    return log;
  }
}
