import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { RequestUser } from '../../../common/interfaces/request-with-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.prisma.user.findUnique({ // 验证用户是否存在且活跃
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        companyId: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return { // 返回将附加到request.user的用户对象
      userId: user.id,
      username: user.username,
      companyId: user.companyId,
      groupId: payload.groupId, // 从JWT获取集团ID
      role: user.role,
    };
  }
}
