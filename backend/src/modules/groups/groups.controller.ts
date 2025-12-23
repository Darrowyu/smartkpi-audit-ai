import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateGroupDto, UpdateGroupDto, GroupQueryDto } from './dto/group.dto';

@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GroupsController {
  constructor(private readonly service: GroupsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN) // 只有平台超级管理员可以创建集团
  create(@Body() dto: CreateGroupDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.GROUP_ADMIN) // 集团管理员可以查看集团列表
  findAll(@Query() query: GroupQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    return this.service.findAll(page, limit, query.search);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GROUP_ADMIN)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GROUP_ADMIN)
  getStats(@Param('id') id: string) {
    return this.service.getStats(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

