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

  /** 批量导入指标 */
  async bulkCreate(definitions: CreateKPIDefinitionDto[], companyId: string) {
    if (definitions.length > 500) {
      throw new BadRequestException('单次最多导入500个指标，请分批导入');
    }

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const dto of definitions) {
      try {
        await this.create(dto, companyId);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${dto.code}: ${error.message}`);
      }
    }

    return results;
  }

  /** 获取指标类型统计 */
  async getStatistics(companyId: string) {
    const stats = await this.prisma.kPIDefinition.groupBy({
      by: ['formulaType'],
      where: { companyId, isActive: true },
      _count: true,
    });

    return stats.reduce(
      (acc, s) => {
        acc[s.formulaType] = s._count;
        return acc;
      },
      {} as Record<FormulaType, number>,
    );
  }
}
