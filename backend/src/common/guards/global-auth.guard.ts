import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, type Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { RequestUser } from '../interfaces/request-with-user.interface';
import { PermissionsService } from '../../modules/permissions/permissions.service';

@Injectable()
export class GlobalAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const result = super.canActivate(context);
    const can =
      typeof result === 'boolean'
        ? result
        : result instanceof Promise
          ? await result
          : await lastValueFrom(result);

    if (!can) return false;

    const request = context.switchToHttp().getRequest();
    const user: RequestUser | undefined = request.user;
    if (!user || !user.companyId) {
      throw new ForbiddenException('User not authenticated');
    }

    request.companyId = user.companyId;
    request.groupId = user.groupId;
    request.userRole = user.role;

    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermission) return true;

    const hasPermission = await this.permissionsService.checkPermission(
      user.companyId,
      user.role,
      requiredPermission,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        `Permission denied. Required: ${requiredPermission}`,
      );
    }

    return true;
  }
}
