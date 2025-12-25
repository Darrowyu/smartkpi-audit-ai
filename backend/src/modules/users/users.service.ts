import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../files/storage.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './dto/user.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async create(dto: CreateUserDto, companyId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) throw new ConflictException('Username already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const { password, ...userData } = dto;
    return this.prisma.user.create({
      data: { ...userData, passwordHash, companyId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        language: true,
        createdAt: true,
      },
    });
  }

  async findAll(
    companyId: string,
    page = 1,
    limit = 20,
    search?: string,
    role?: UserRole,
  ) {
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
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
          department: { select: { id: true, name: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
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
        department: { select: { id: true, name: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    companyId: string,
    currentUserId: string,
    currentUserRole: UserRole,
  ) {
    await this.findOne(id, companyId);

    // 只有ADMIN可以修改其他用户角色
    if (
      dto.role &&
      currentUserRole !== UserRole.GROUP_ADMIN &&
      currentUserRole !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only admins can change user roles');
    }

    // 处理数据：移除username（不可更改），处理password
    const { username, password, ...updateData } = dto;
    const data: any = { ...updateData };

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        language: true,
        isActive: true,
      },
    });
  }

  async remove(id: string, companyId: string, currentUserId: string) {
    if (id === currentUserId)
      throw new ForbiddenException('Cannot delete yourself');
    await this.findOne(id, companyId);
    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    return { message: 'User deactivated' };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        language: true,
        isActive: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isValid)
      throw new BadRequestException('Current password is incorrect');

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
    return { message: 'Password changed successfully' };
  }

  async uploadAvatar(
    userId: string,
    companyId: string,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    const mimeToExt: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
    }; // 验证格式：只允许PNG和JPG
    const ext = mimeToExt[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Only PNG and JPG formats are supported');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const avatarPath = await this.storage.saveAvatar(userId, file.buffer, ext); // 保存到avatars目录，自动覆盖旧文件

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarPath },
      select: { id: true, avatar: true },
    });
  }

  async getAvatar(
    userId: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });
    if (!user?.avatar) throw new NotFoundException('Avatar not found');

    const buffer = await this.storage.readFile(user.avatar);
    const ext = user.avatar.split('.').pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
    };
    return { buffer, mimeType: mimeMap[ext || ''] || 'image/jpeg' };
  }
}
