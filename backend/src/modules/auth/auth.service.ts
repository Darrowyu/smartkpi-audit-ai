import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private permissionsService: PermissionsService,
    private mailService: MailService,
  ) {}

  /** 用户名登录 */
  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      // 按用户名查找用户
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
        tokenVersion: true,
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

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    ); // 验证密码
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      // 更新最后登录时间
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.prisma.loginHistory.updateMany({
      where: { userId: user.id },
      data: { isCurrent: false },
    }); // 清除旧的当前会话标记
    const { device, browser, os } = this.parseUserAgent(userAgent || '');
    const location = await this.getLocationFromIp(ipAddress || '');
    await this.prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent,
        device,
        browser,
        os,
        location,
        isCurrent: true,
      },
    });

    const accessToken = await this.generateToken(user); // 生成JWT令牌

    const { passwordHash, company, tokenVersion, ...userWithoutPassword } =
      user; // 从响应中移除敏感字段

    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  /** 解析 User-Agent */
  private parseUserAgent(ua: string): {
    device: string;
    browser: string;
    os: string;
  } {
    let device = 'Unknown Device';
    let browser = 'Unknown';
    let os = 'Unknown';

    if (/iPhone/.test(ua)) {
      device = 'iPhone';
      os = 'iOS';
    } else if (/iPad/.test(ua)) {
      device = 'iPad';
      os = 'iOS';
    } else if (/Android/.test(ua)) {
      device = 'Android Device';
      os = 'Android';
    } else if (/Macintosh/.test(ua)) {
      device = 'Mac';
      os = 'macOS';
    } else if (/Windows/.test(ua)) {
      device = 'Windows PC';
      os = 'Windows';
    } else if (/Linux/.test(ua)) {
      device = 'Linux PC';
      os = 'Linux';
    }

    if (/Edg\//.test(ua)) browser = 'Edge';
    else if (/Chrome\//.test(ua)) browser = 'Chrome';
    else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
    else if (/Firefox\//.test(ua)) browser = 'Firefox';

    return { device: `${device} - ${browser}`, browser, os };
  }

  /** 通过IP获取地理位置 */
  private async getLocationFromIp(ip: string): Promise<string | null> {
    if (
      !ip ||
      ip === '::1' ||
      ip === '127.0.0.1' ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.')
    ) {
      return '本地网络';
    }
    try {
      const cleanIp = ip.replace(/^::ffff:/, '');
      const res = await fetch(
        `http://ip-api.com/json/${cleanIp}?lang=zh-CN&fields=status,country,regionName,city`,
      );
      const data = await res.json();
      if (data.status === 'success') {
        return data.city
          ? `${data.city}, ${data.country}`
          : data.country || null;
      }
      return null;
    } catch {
      this.logger.warn(`Failed to get location for IP: ${ip}`);
      return null;
    }
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
        phoneNumber: true,
        bio: true,
        avatar: true,
        role: true,
        companyId: true,
        departmentId: true,
        linkedEmployeeId: true,
        language: true,
        createdAt: true,
        lastLoginAt: true,
        department: { select: { id: true, name: true } },
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

    const permissions = await this.permissionsService.getUserPermissions(
      user.companyId,
      user.role,
    ); // 获取用户权限列表

    return {
      ...user,
      groupId: user.company?.groupId,
      permissions,
    };
  }

  /** 登出：撤销当前用户全部会话 */
  async logout(userId: string): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    return { message: 'Logged out' };
  }

  /** 延长会话：签发新的访问令牌（滑动过期） */
  async extendSession(userId: string): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        companyId: true,
        role: true,
        tokenVersion: true,
        isActive: true,
        company: { select: { groupId: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const accessToken = await this.generateToken(user);
    return { accessToken };
  }

  /** 忘记密码 - 生成重置令牌 */
  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string; resetUrl?: string }> {
    const user = await this.prisma.user.findFirst({
      where: { username: dto.username, email: dto.email, isActive: true }, // 同时匹配用户名和邮箱
    });

    if (!user) {
      return { message: 'If email exists, reset link has been sent' }; // 安全考虑，不暴露邮箱是否存在
    }

    const resetToken = crypto.randomBytes(32).toString('hex'); // 生成随机token
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex'); // 哈希存储
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时有效期

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: expiresAt,
      },
    });

    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailSent = await this.mailService.sendPasswordReset(
      user.email!,
      resetUrl,
      user.username,
    ); // 发送重置邮件

    if (!mailSent) {
      this.logger.warn(
        `[Password Reset] Mail service disabled. userId=${user.id}`,
      );
    }

    const response: { message: string; resetUrl?: string } = {
      message: 'If email exists, reset link has been sent',
    };

    if (this.configService.get('NODE_ENV') !== 'production') {
      // 仅开发环境返回URL
      response.resetUrl = resetUrl;
    }

    return response;
  }

  /** 重置密码 */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

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
        tokenVersion: { increment: 1 },
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
    tokenVersion: number;
  }): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      companyId: user.companyId,
      groupId: user.company.groupId, // 添加集团ID到JWT
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION') || '15m',
    });
  }
}
