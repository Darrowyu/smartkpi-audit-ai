import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto, companyId: string) {
    if (dto.code) { // 检查代码唯一性
      const existing = await this.prisma.department.findFirst({
        where: { companyId, code: dto.code },
      });
      if (existing) throw new ConflictException('Department code already exists');
    }

    return this.prisma.department.create({
      data: { ...dto, companyId },
    });
  }

  async findAll(companyId: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = {
      companyId,
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { _count: { select: { employees: true } } },
      }),
      this.prisma.department.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, companyId: string) {
    const dept = await this.prisma.department.findFirst({
      where: { id, companyId },
      include: { employees: { where: { isActive: true }, take: 10 } },
    });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async update(id: string, dto: UpdateDepartmentDto, companyId: string) {
    await this.findOne(id, companyId); // 验证存在性和租户
    if (dto.code) { // 检查代码唯一性
      const existing = await this.prisma.department.findFirst({
        where: { companyId, code: dto.code, NOT: { id } },
      });
      if (existing) throw new ConflictException('Department code already exists');
    }
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.department.update({ where: { id }, data: { isActive: false } }); // 软删除
    return { message: 'Department deleted' };
  }
}
