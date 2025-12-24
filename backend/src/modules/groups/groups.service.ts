import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/group.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGroupDto) {
    // 检查集团名称是否已存在
    const existing = await this.prisma.group.findFirst({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException('Group name already exists');

    return this.prisma.group.create({
      data: dto,
      include: { _count: { select: { companies: true } } },
    });
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = {
      isActive: true,
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { _count: { select: { companies: true } } },
      }),
      this.prisma.group.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        companies: { where: { isActive: true }, take: 50 },
        _count: { select: { companies: true } },
      },
    });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async update(id: string, dto: UpdateGroupDto) {
    await this.findOne(id); // 验证存在性
    if (dto.name) {
      const existing = await this.prisma.group.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) throw new ConflictException('Group name already exists');
    }
    return this.prisma.group.update({
      where: { id },
      data: dto,
      include: { _count: { select: { companies: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.group.update({
      where: { id },
      data: { isActive: false },
    }); // 软删除
    return { message: 'Group deleted' };
  }

  // 获取集团统计数据
  async getStats(groupId: string) {
    const [companies, users, departments] = await Promise.all([
      this.prisma.company.count({ where: { groupId, isActive: true } }),
      this.prisma.user.count({
        where: { company: { groupId }, isActive: true },
      }),
      this.prisma.department.count({
        where: { company: { groupId }, isActive: true },
      }),
    ]);
    return {
      totalCompanies: companies,
      totalUsers: users,
      totalDepartments: departments,
    };
  }
}
