import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/user.dto';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  @Roles(UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateUserDto, @CurrentUser('companyId') companyId: string) {
    return this.service.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findAll(@Query() query: UserQueryDto, @CurrentUser('companyId') companyId: string) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    return this.service.findAll(companyId, page, limit, query.search, query.role as UserRole);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('companyId') companyId: string) {
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
    return this.service.update(id, dto, companyId, currentUserId, currentUserRole);
  }

  @Delete(':id')
  @Roles(UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('companyId') companyId: string, @CurrentUser('userId') currentUserId: string) {
    return this.service.remove(id, companyId, currentUserId);
  }
}
