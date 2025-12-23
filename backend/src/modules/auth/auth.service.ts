import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

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
        language: true,
        createdAt: true,
        lastLoginAt: true,
        company: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
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
