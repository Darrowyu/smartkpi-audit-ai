import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateUserDto, companyId: string) {
    const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existing) throw new ConflictException('Username already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const { password, ...userData } = dto;
    return this.prisma.user.create({
      data: { ...userData, passwordHash, companyId },
      select: { id: true, username: true, email: true, firstName: true, lastName: true, role: true, language: true, createdAt: true },
    });
  }

  async findAll(companyId: string, page = 1, limit = 20, search?: string, role?: UserRole) {
    const skip = (page - 1) * limit;
    const where = {
      companyId,
      ...(role && { role }),
      ...(search && {
        OR: [
          { username: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          language: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          departmentId: true,
          department: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, companyId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        language: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        departmentId: true,
        department: { select: { id: true, name: true, code: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto, companyId: string, currentUserId: string, currentUserRole: UserRole) {
    const user = await this.findOne(id, companyId);

    // 只有ADMIN可以修改其他用户角色
    if (dto.role && currentUserRole !== UserRole.GROUP_ADMIN && currentUserRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only admins can change user roles');
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, username: true, email: true, firstName: true, lastName: true, role: true, language: true, isActive: true },
    });
  }

  async remove(id: string, companyId: string, currentUserId: string) {
    if (id === currentUserId) throw new ForbiddenException('Cannot delete yourself');
    await this.findOne(id, companyId);
    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    return { message: 'User deactivated' };
  }
}
