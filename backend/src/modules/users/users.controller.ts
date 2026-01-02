import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Patch,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
  UpdateProfileDto,
  ChangePasswordDto,
  UpdateNotificationSettingsDto,
  UpdateKpiPreferencesDto,
  UpdateAppearanceSettingsDto,
  UpdateRegionalSettingsDto,
} from './dto/user.dto';
import { UserRole } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Patch('me/profile')
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.service.updateProfile(userId, dto);
  }

  @Post('me/password')
  changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.service.changePassword(userId, dto);
  }

  @Get('me/notification-settings')
  getNotificationSettings(@CurrentUser('userId') userId: string) {
    return this.service.getNotificationSettings(userId);
  }

  @Patch('me/notification-settings')
  updateNotificationSettings(
    @Body() dto: UpdateNotificationSettingsDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.service.updateNotificationSettings(userId, dto);
  }

  @Get('me/login-history')
  getLoginHistory(@CurrentUser('userId') userId: string) {
    return this.service.getLoginHistory(userId);
  }

  @Get('me/kpi-preferences')
  getKpiPreferences(@CurrentUser('userId') userId: string) {
    return this.service.getKpiPreferences(userId);
  }

  @Patch('me/kpi-preferences')
  updateKpiPreferences(
    @Body() dto: UpdateKpiPreferencesDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.service.updateKpiPreferences(userId, dto);
  }

  @Get('me/appearance-settings')
  getAppearanceSettings(@CurrentUser('userId') userId: string) {
    return this.service.getAppearanceSettings(userId);
  }

  @Patch('me/appearance-settings')
  updateAppearanceSettings(
    @Body() dto: UpdateAppearanceSettingsDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.service.updateAppearanceSettings(userId, dto);
  }

  @Get('me/regional-settings')
  getRegionalSettings(@CurrentUser('userId') userId: string) {
    return this.service.getRegionalSettings(userId);
  }

  @Patch('me/regional-settings')
  updateRegionalSettings(
    @Body() dto: UpdateRegionalSettingsDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.service.updateRegionalSettings(userId, dto);
  }

  @Post('me/avatar') // POST /api/users/me/avatar - 上传头像
  @UseInterceptors(FileInterceptor('avatar'))
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('userId') userId: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.service.uploadAvatar(userId, companyId, file);
  }

  @Public()
  @Get('avatar/:userId') // GET /api/users/avatar/:userId - 获取用户头像（公开访问）
  async getAvatar(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Res() res: Response,
  ) {
    const { buffer, mimeType } = await this.service.getAvatar(userId);
    res.set({
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=86400',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });
    res.send(buffer);
  }

  @Post()
  @Roles(UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser('companyId') currentCompanyId: string,
    @CurrentUser('groupId') groupId: string,
  ) {
    const targetCompanyId = dto.companyId || currentCompanyId;
    return this.service.create(dto, targetCompanyId, groupId);
  }

  @Get()
  @Roles(UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findAll(
    @Query() query: UserQueryDto,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('groupId') groupId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const isGroupLevel =
      role === UserRole.GROUP_ADMIN || role === UserRole.SUPER_ADMIN;
    return this.service.findAll(
      isGroupLevel ? undefined : companyId,
      groupId,
      page,
      limit,
      query.search,
      query.role as UserRole,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.service.findOne(id, companyId);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') currentUserId: string,
    @CurrentUser('role') currentUserRole: UserRole,
  ) {
    return this.service.update(
      id,
      dto,
      companyId,
      currentUserId,
      currentUserRole,
    );
  }

  @Delete(':id')
  @Roles(UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') currentUserId: string,
  ) {
    return this.service.remove(id, companyId, currentUserId);
  }
}
