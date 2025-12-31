import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoUtil } from '../../common/utils/crypto.util';

@Injectable()
export class DataSourceService {
  private readonly encryptionKey: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get('DATASOURCE_ENCRYPTION_KEY') || this.configService.get('JWT_SECRET') || 'default-key';
  }

  /** 加密连接配置 */
  private encryptConfig(config: Record<string, any>): string {
    return CryptoUtil.encrypt(config, this.encryptionKey);
  }

  /** 解密连接配置 */
  private decryptConfig(encrypted: any): Record<string, any> {
    if (typeof encrypted === 'string') {
      return CryptoUtil.decrypt(encrypted, this.encryptionKey);
    }
    return encrypted as Record<string, any>; // 兼容旧数据（未加密的JSON）
  }

  async createDataSource(companyId: string, dto: { name: string; type: string; connectionConfig: Record<string, any>; fieldMapping: Record<string, any>; syncFrequency?: string }) {
    return this.prisma.dataSourceConfig.create({
      data: {
        companyId,
        name: dto.name,
        type: dto.type,
        connectionConfig: this.encryptConfig(dto.connectionConfig), // 加密存储
        fieldMapping: dto.fieldMapping,
        syncFrequency: dto.syncFrequency || 'daily',
      },
    });
  }

  async getDataSources(companyId: string) {
    const sources = await this.prisma.dataSourceConfig.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
    return sources.map((ds) => ({
      ...ds,
      connectionConfig: this.decryptConfig(ds.connectionConfig), // 解密返回
    }));
  }

  async getDataSource(id: string, companyId: string) {
    const ds = await this.prisma.dataSourceConfig.findFirst({
      where: { id, companyId }, // 添加companyId校验防止IDOR
    });
    if (!ds) throw new NotFoundException('数据源不存在');
    return { ...ds, connectionConfig: this.decryptConfig(ds.connectionConfig) };
  }

  async updateDataSource(id: string, companyId: string, dto: Partial<{ name: string; connectionConfig: Record<string, any>; fieldMapping: Record<string, any>; syncFrequency: string; isActive: boolean }>) {
    await this.getDataSource(id, companyId); // 校验权限
    const updateData: any = { ...dto };
    if (dto.connectionConfig) {
      updateData.connectionConfig = this.encryptConfig(dto.connectionConfig); // 加密更新
    }
    return this.prisma.dataSourceConfig.update({ where: { id }, data: updateData });
  }

  async deleteDataSource(id: string, companyId: string) {
    await this.getDataSource(id, companyId); // 校验权限
    return this.prisma.dataSourceConfig.delete({ where: { id } });
  }

  async testConnection(id: string, companyId: string) {
    const ds = await this.getDataSource(id, companyId); // 校验权限
    // 模拟连接测试
    return { success: true, message: '连接测试成功' };
  }

  async triggerSync(id: string, companyId: string) {
    const ds = await this.getDataSource(id, companyId); // 校验权限

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

  async getSyncStatus(logId: string, companyId: string) {
    const log = await this.prisma.dataSyncLog.findFirst({
      where: { id: logId, companyId }, // 添加companyId校验
    });
    if (!log) throw new NotFoundException('同步日志不存在');
    return log;
  }
}
