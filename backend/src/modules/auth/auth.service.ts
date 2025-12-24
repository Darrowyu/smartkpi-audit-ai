import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserRole } from '@prisma/client';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private permissionsService: PermissionsService,
  ) { }

  /** 用户名登录 */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({ // 按用户名查找用户
      where: { username: loginDto.username },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        role: true,
        companyId: true,
        language: true,
        isActive: true,
        company: { select: { groupId: true } }, // 获取集团ID
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash); // 验证密码
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({ // 更新最后登录时间
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = await this.generateToken(user); // 生成JWT令牌

    const { passwordHash, company, ...userWithoutPassword } = user; // 从响应中移除密码哈希

    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  /** 获取当前用户信息 */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        companyId: true,
        departmentId: true,
        linkedEmployeeId: true,
        language: true,
        createdAt: true,
        lastLoginAt: true,
        company: {
          select: {
            id: true,
            name: true,
            domain: true,
            groupId: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const permissions = await this.permissionsService.getUserPermissions(user.companyId, user.role as UserRole); // 获取用户权限列表

    return {
      ...user,
      groupId: user.company?.groupId,
      permissions,
    };
  }

  /** 忘记密码 - 生成重置令牌 */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string; resetUrl?: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, isActive: true },
    });

    if (!user) {
      return { message: 'If email exists, reset link has been sent' }; // 安全考虑，不暴露邮箱是否存在
    }

    const resetToken = crypto.randomBytes(32).toString('hex'); // 生成随机token
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // 哈希存储
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时有效期

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: expiresAt,
      },
    });

    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // TODO: 集成邮件服务后，这里发送邮件
    // await this.emailService.sendPasswordResetEmail(user.email, resetUrl);

    console.log(`[Password Reset] User: ${user.email}, Reset URL: ${resetUrl}`); // 开发阶段日志

    return {
      message: 'If email exists, reset link has been sent',
      resetUrl, // 开发阶段返回URL，生产环境移除此字段
    };
  }

  /** 重置密码 */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const hashedToken = crypto.createHash('sha256').update(dto.token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() }, // 检查是否过期
        isActive: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetToken: null, // 清除token
        passwordResetExpires: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  /** 生成JWT访问令牌 */
  private async generateToken(user: {
    id: string;
    username: string;
    companyId: string;
    role: UserRole;
    company: { groupId: string };
  }): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      companyId: user.companyId,
      groupId: user.company.groupId, // 添加集团ID到JWT
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION') || '15m',
    });
  }
}
