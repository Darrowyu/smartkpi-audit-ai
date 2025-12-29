import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PermissionsService, RolePermissions } from './permissions.service';
import { UserRole } from '@prisma/client';

@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) { }

  /** 获取所有可用权限列表 */
  @Get('all')
  @Roles(UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  getAllPermissions() {
    return this.permissionsService.getAllPermissions();
  }

  /** 获取当前公司的角色权限配置 */
  @Get('config')
  @Roles(UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  async getRolePermissions(@Request() req: any) {
    return this.permissionsService.getRolePermissions(req.user.companyId);
  }

  /** 保存角色权限配置 */
  @Put('config')
  @Roles(UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  async saveRolePermissions(
    @Body() body: { rolePermissions: RolePermissions },
    @Request() req: any,
  ) {
    await this.permissionsService.saveRolePermissions(
      req.user.companyId,
      body.rolePermissions,
      req.user.userId,
    );
    return { success: true, message: '权限配置已保存' };
  }

  /** 获取当前用户的权限列表 */
  @Get('my')
  async getMyPermissions(@Request() req: any) {
    return this.permissionsService.getUserPermissions(
      req.user.companyId,
      req.user.role,
    );
  }

  /** 检查当前用户是否有特定权限 */
  @Post('check')
  async checkPermission(
    @Body('permissionId') permissionId: string,
    @Request() req: any,
  ) {
    const hasPermission = await this.permissionsService.checkPermission(
      req.user.companyId,
      req.user.role,
      permissionId,
    );
    return { permissionId, hasPermission };
  }

  /** 重置为默认权限 */
  @Post('reset')
  @Roles(UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  async resetToDefault(@Request() req: any) {
    await this.permissionsService.resetToDefault(req.user.companyId);
    return { success: true, message: '已重置为默认权限' };
  }
}
