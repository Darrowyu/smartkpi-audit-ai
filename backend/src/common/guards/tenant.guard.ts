import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestUser } from '../interfaces/request-with-user.interface';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/** 租户守卫：确保多租户数据隔离，验证用户只能访问自己公司的数据 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    if (!user || !user.companyId) {
      // 确保用户已认证且有companyId
      throw new ForbiddenException(
        'Tenant context not found. User must be authenticated.',
      );
    }

    request.companyId = user.companyId; // 将companyId注入请求，便于服务层访问
    request.groupId = user.groupId; // 将groupId注入请求
    request.userRole = user.role; // 将用户角色注入请求

    return true; // 资源ID与用户公司的匹配验证在服务层通过过滤实现
  }
}
