import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestUser } from '../interfaces/request-with-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [ // 从装饰器元数据获取所需角色
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true; // 无角色要求则放行

    const request = context.switchToHttp().getRequest(); // 从请求获取用户
    const user: RequestUser = request.user;

    if (!user) throw new ForbiddenException('User not authenticated');

    const hasRole = requiredRoles.includes(user.role); // 检查用户是否拥有所需角色

    if (!hasRole) {
      throw new ForbiddenException(`Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
