import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission'; // 权限元数据 Key
export const Permission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission); // 权限装饰器
