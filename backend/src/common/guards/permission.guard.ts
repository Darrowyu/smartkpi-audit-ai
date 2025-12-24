import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { RequestUser } from '../interfaces/request-with-user.interface';
import { PermissionsService } from '../../modules/permissions/permissions.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [
        // 从装饰器获取所需权限
        context.getHandler(),
        context.getClass(),
      ],
    );

    if (!requiredPermission) return true; // 无权限要求则放行

    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    if (!user) throw new ForbiddenException('User not authenticated');

    const hasPermission = await this.permissionsService.checkPermission(
      user.companyId,
      user.role,
      requiredPermission,
    ); // 检查权限

    if (!hasPermission) {
      throw new ForbiddenException(
        `Permission denied. Required: ${requiredPermission}`,
      );
    }

    return true;
  }
}
