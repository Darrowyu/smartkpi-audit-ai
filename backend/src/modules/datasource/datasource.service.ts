import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoUtil } from '../../common/utils/crypto.util';

@Injectable()
export class DataSourceService {
  private readonly encryptionKey: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const key =
      this.configService.get<string>('DATASOURCE_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_SECRET');
    if (!key || key.length < 32) {
      throw new Error(
        'DATASOURCE_ENCRYPTION_KEY (or JWT_SECRET) must be set and at least 32 characters',
      );
    }
    this.encryptionKey = key;
  }

  /** 加密连接配置 */
  private encryptConfig(config: Record<string, unknown>): string {
    return CryptoUtil.encrypt(config, this.encryptionKey);
  }

  /** 解密连接配置 */
  private decryptConfig(encrypted: unknown): Record<string, unknown> {
    if (typeof encrypted === 'string') {
      return CryptoUtil.decrypt(encrypted, this.encryptionKey);
    }
    return (encrypted || {}) as Record<string, unknown>; // 兼容旧数据（未加密的JSON）
  }

  async createDataSource(
    companyId: string,
    dto: {
      name: string;
      type: string;
      connectionConfig: Record<string, unknown>;
      fieldMapping: Prisma.InputJsonValue;
      syncFrequency?: string;
    },
  ) {
    const created = await this.prisma.dataSourceConfig.create({
      data: {
        companyId,
        name: dto.name,
        type: dto.type,
        connectionConfig: this.encryptConfig(dto.connectionConfig), // 加密存储
        fieldMapping: dto.fieldMapping,
        syncFrequency: dto.syncFrequency || 'daily',
      },
    });

    return { ...created, connectionConfig: {} };
  }

  async getDataSources(companyId: string) {
    const sources = await this.prisma.dataSourceConfig.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
    return sources.map((ds) => ({
      ...ds,
      connectionConfig: {},
    }));
  }

  async getDataSource(id: string, companyId: string) {
    const ds = await this.prisma.dataSourceConfig.findFirst({
      where: { id, companyId }, // 添加companyId校验防止IDOR
    });
    if (!ds) throw new NotFoundException('数据源不存在');
    return { ...ds, connectionConfig: {} };
  }

  async updateDataSource(
    id: string,
    companyId: string,
    dto: Partial<{
      name: string;
      connectionConfig: Record<string, unknown>;
      fieldMapping: Prisma.InputJsonValue;
      syncFrequency: string;
      isActive: boolean;
    }>,
  ) {
    await this.getDataSource(id, companyId); // 校验权限
    const updateData: any = { ...dto };
    if (dto.connectionConfig) {
      updateData.connectionConfig = this.encryptConfig(dto.connectionConfig); // 加密更新
    }
    const updated = await this.prisma.dataSourceConfig.update({
      where: { id },
      data: updateData,
    });

    return { ...updated, connectionConfig: {} };
  }

  async deleteDataSource(id: string, companyId: string) {
    await this.getDataSource(id, companyId); // 校验权限
    return this.prisma.dataSourceConfig.delete({ where: { id } });
  }

  async testConnection(id: string, companyId: string) {
    await this.getDataSource(id, companyId); // 校验权限
    // 模拟连接测试
    return { success: true, message: '连接测试成功' };
  }

  async triggerSync(id: string, companyId: string) {
    await this.getDataSource(id, companyId); // 校验权限

    const log = await this.prisma.dataSyncLog.create({
      data: {
        dataSourceId: id,
        companyId,
        startedAt: new Date(),
        status: 'running',
      },
    });

    // 模拟同步过程
    setTimeout(() => {
      void (async () => {
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
      })();
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

  async getSyncStatus(logId: string, companyId: string) {
    const log = await this.prisma.dataSyncLog.findFirst({
      where: { id: logId, companyId }, // 添加companyId校验
    });
    if (!log) throw new NotFoundException('同步日志不存在');
    return log;
  }
}
