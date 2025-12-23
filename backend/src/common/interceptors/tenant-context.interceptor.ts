import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestUser } from '../interfaces/request-with-user.interface';

/** 租户上下文拦截器：自动将认证用户的companyId注入到每个请求中 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    if (user && user.companyId) { // 将认证用户的companyId注入请求
      request.companyId = user.companyId;
      request.tenantId = user.companyId; // 别名
    }

    return next.handle();
  }
}
