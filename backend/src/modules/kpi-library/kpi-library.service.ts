import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FormulaEngine } from '../calculation/engines/formula.engine';
import {
  CreateKPIDefinitionDto,
  UpdateKPIDefinitionDto,
  QueryKPIDefinitionDto,
} from './dto';
import { FormulaType } from '@prisma/client';

@Injectable()
export class KPILibraryService {
  constructor(
    private prisma: PrismaService,
    private formulaEngine: FormulaEngine,
  ) {}

  /** 创建 KPI 指标定义 */
  async create(dto: CreateKPIDefinitionDto, companyId: string) {
    const existing = await this.prisma.kPIDefinition.findFirst({
      // 检查编码是否重复
      where: { companyId, code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`指标编码 "${dto.code}" 已存在`);
    }

    if (dto.customFormula) {
      // 验证自定义公式语法
      const validation = this.formulaEngine.validateFormula(dto.customFormula);
      if (!validation.valid) {
        throw new ConflictException(`公式语法错误: ${validation.error}`);
      }
    }

    return this.prisma.kPIDefinition.create({
      data: {
        ...dto,
        companyId,
      },
    });
  }

  /** 获取指标列表（分页、搜索、筛选） */
  async findAll(
    query: QueryKPIDefinitionDto,
    companyId: string,
    groupId?: string,
  ) {
    const {
      search,
      formulaType,
      frequency,
      isActive,
      page = 1,
      limit = 20,
    } = query;
    const skip = (page - 1) * limit;

    const where = {
      AND: [
        {
          OR: [
            { companyId },
            { isGlobal: true },
            ...(groupId ? [{ groupId }] : []),
          ],
        }, // 权限过滤
        search
          ? {
              OR: [
                { name: { contains: search } },
                { code: { contains: search } },
              ],
            }
          : {},
        formulaType ? { formulaType } : {},
        frequency ? { frequency } : {},
        typeof isActive === 'boolean' ? { isActive } : {},
      ],
    };

    const [data, total] = await Promise.all([
      this.prisma.kPIDefinition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.kPIDefinition.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** 获取单个指标详情 */
  async findOne(id: string, companyId: string) {
    const kpi = await this.prisma.kPIDefinition.findFirst({
      where: { id, OR: [{ companyId }, { isGlobal: true }] },
      include: { assignments: { take: 5, orderBy: { createdAt: 'desc' } } },
    });

    if (!kpi) throw new NotFoundException('指标不存在');
    return kpi;
  }

  /** 更新指标 */
  async update(id: string, dto: UpdateKPIDefinitionDto, companyId: string) {
    const kpi = await this.prisma.kPIDefinition.findFirst({
      where: { id, companyId },
    });

    if (!kpi) throw new NotFoundException('指标不存在');

    if (dto.customFormula) {
      // 验证新公式
      const validation = this.formulaEngine.validateFormula(dto.customFormula);
      if (!validation.valid) {
        throw new ConflictException(`公式语法错误: ${validation.error}`);
      }
    }

    return this.prisma.kPIDefinition.update({
      where: { id },
      data: dto,
    });
  }

  /** 删除指标（软删除） */
  async remove(id: string, companyId: string) {
    const kpi = await this.prisma.kPIDefinition.findFirst({
      where: { id, companyId },
    });

    if (!kpi) throw new NotFoundException('指标不存在');

    return this.prisma.kPIDefinition.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /** 批量导入指标（事务） */
  async bulkCreate(definitions: CreateKPIDefinitionDto[], companyId: string) {
    if (definitions.length > 500) {
      throw new BadRequestException('单次最多导入500个指标，请分批导入');
    }

    // 预验证所有公式
    for (const dto of definitions) {
      if (dto.customFormula) {
        const validation = this.formulaEngine.validateFormula(dto.customFormula);
        if (!validation.valid) {
          throw new BadRequestException(
            `指标 ${dto.code} 公式语法错误: ${validation.error}`,
          );
        }
      }
    }

    // 检查编码重复
    const codes = definitions.map((d) => d.code);
    const existing = await this.prisma.kPIDefinition.findMany({
      where: { companyId, code: { in: codes } },
      select: { code: true },
    });

    if (existing.length > 0) {
      const duplicates = existing.map((e) => e.code).join(', ');
      throw new ConflictException(`以下指标编码已存在: ${duplicates}`);
    }

    // 使用createMany批量创建
    const result = await this.prisma.kPIDefinition.createMany({
      data: definitions.map((dto) => ({ ...dto, companyId })),
      skipDuplicates: true,
    });

    return { success: result.count, failed: 0, errors: [] };
  }

  /** 获取指标完整统计 */
  async getStatistics(companyId: string, groupId?: string) {
    const where = {
      OR: [
        { companyId },
        { isGlobal: true },
        ...(groupId ? [{ groupId }] : []),
      ],
    };

    const [total, active, byType, byFrequency] = await Promise.all([
      this.prisma.kPIDefinition.count({ where }),
      this.prisma.kPIDefinition.count({
        where: { AND: [where, { isActive: true }] },
      }),
      this.prisma.kPIDefinition.groupBy({
        by: ['formulaType'],
        where: { AND: [where, { isActive: true }] },
        _count: true,
      }),
      this.prisma.kPIDefinition.groupBy({
        by: ['frequency'],
        where: { AND: [where, { isActive: true }] },
        _count: true,
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byType: byType.reduce(
        (acc, s) => ({ ...acc, [s.formulaType]: s._count }),
        {} as Record<string, number>,
      ),
      byFrequency: byFrequency.reduce(
        (acc, s) => ({ ...acc, [s.frequency]: s._count }),
        {} as Record<string, number>,
      ),
    };
  }
}
