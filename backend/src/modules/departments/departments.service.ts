import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto, companyId: string, groupId: string) {
    // 验证目标公司属于当前集团
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, groupId, isActive: true },
    });
    if (!company) throw new ForbiddenException('Invalid company or access denied');

    const { companyId: _, ...deptData } = dto;
    return this.prisma.department.create({
      data: { ...deptData, companyId },
    });
  }

  async findAll(companyId: string, groupId: string, page = 1, limit = 20, search?: string) {
    // 验证目标公司属于当前集团
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, groupId, isActive: true },
    });
    if (!company) throw new ForbiddenException('Invalid company or access denied');

    const skip = (page - 1) * limit;
    const where = {
      companyId,
      isActive: true,
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
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

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
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
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.department.update({
      where: { id },
      data: { isActive: false },
    }); // 软删除
    return { message: 'Department deleted' };
  }
}
