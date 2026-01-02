import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateCompanyDto, CreateCompanyDto } from './dto/company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  // 获取单个公司（当前用户的公司）
  async findOne(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        group: { select: { id: true, name: true } },
        _count: {
          select: {
            users: true,
            departments: true,
            employees: true,
            uploadedFiles: true,
            kpiAnalyses: true,
          },
        },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  // 更新当前公司
  async update(companyId: string, dto: UpdateCompanyDto) {
    await this.findOne(companyId);
    return this.prisma.company.update({ where: { id: companyId }, data: dto });
  }

  // 获取公司统计数据
  async getStats(companyId: string) {
    const [users, departments, employees, files, analyses] = await Promise.all([
      this.prisma.user.count({ where: { companyId, isActive: true } }),
      this.prisma.department.count({ where: { companyId, isActive: true } }),
      this.prisma.employee.count({ where: { companyId, isActive: true } }),
      this.prisma.uploadedFile.count({ where: { companyId } }),
      this.prisma.kPIAnalysis.count({ where: { companyId } }),
    ]);
    return { users, departments, employees, files, analyses };
  }

  // ========== GROUP_ADMIN 专用方法 ==========

  // 创建子公司
  async create(dto: CreateCompanyDto, groupId: string) {
    if (dto.code) {
      const existing = await this.prisma.company.findFirst({
        where: { groupId, code: dto.code },
      });
      if (existing) throw new ConflictException('Company code already exists');
    }

    return this.prisma.company.create({
      data: { ...dto, groupId },
      include: {
        group: { select: { id: true, name: true } },
        _count: { select: { users: true, departments: true, employees: true } },
      },
    });
  }

  // 获取集团下所有子公司
  async findAll(groupId: string, page = 1, limit = 50, search?: string) {
    const skip = (page - 1) * limit;
    const where = {
      groupId,
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { domain: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { users: true, departments: true, employees: true },
          },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // 获取指定子公司详情（验证groupId）
  async findOneById(id: string, groupId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, groupId },
      include: {
        group: { select: { id: true, name: true } },
        _count: {
          select: {
            users: true,
            departments: true,
            employees: true,
            uploadedFiles: true,
            kpiAnalyses: true,
          },
        },
      },
    });
    if (!company)
      throw new NotFoundException('Company not found or access denied');
    return company;
  }

  // 更新指定子公司（验证groupId）
  async updateById(id: string, dto: UpdateCompanyDto, groupId: string) {
    const company = await this.findOneById(id, groupId);
    const newDomain = dto.domain?.trim() || null;
    const newCode = dto.code?.trim() || null;
    if (newCode && newCode !== company.code) {
      const existing = await this.prisma.company.findFirst({
        where: { groupId, code: newCode, NOT: { id } },
      });
      if (existing) throw new ConflictException('Company code already exists');
    }
    const data = { ...dto, domain: newDomain, code: newCode };
    return this.prisma.company.update({
      where: { id },
      data,
      include: {
        group: { select: { id: true, name: true } },
        _count: { select: { users: true, departments: true, employees: true } },
      },
    });
  }

  // 删除子公司（软删除，验证groupId，检查是否有关联数据）
  async remove(id: string, groupId: string) {
    const company = await this.findOneById(id, groupId);

    const userCount = company._count?.users ?? 0;
    const deptCount = company._count?.departments ?? 0;

    if (userCount > 0) {
      throw new ForbiddenException(
        `无法删除：该公司下还有 ${userCount} 个用户`,
      );
    }
    if (deptCount > 0) {
      throw new ForbiddenException(
        `无法删除：该公司下还有 ${deptCount} 个部门`,
      );
    }

    await this.prisma.company.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: 'Company deleted successfully' };
  }
}
