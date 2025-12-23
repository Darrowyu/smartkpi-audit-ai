import { Controller, Get, Put, Body, UseGuards, Post, Delete, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateCompanyDto, CreateCompanyDto, CompanyQueryDto } from './dto/company.dto';
import { UserRole } from '@prisma/client';

@Controller('company')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  // 获取当前用户的公司信息
  @Get()
  @UseGuards(TenantGuard)
  findOne(@CurrentUser('companyId') companyId: string) {
    return this.service.findOne(companyId);
  }

  // 获取当前公司统计数据
  @Get('stats')
  @UseGuards(TenantGuard)
  getStats(@CurrentUser('companyId') companyId: string) {
    return this.service.getStats(companyId);
  }

  // 更新当前公司信息
  @Put()
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  update(@CurrentUser('companyId') companyId: string, @Body() dto: UpdateCompanyDto) {
    return this.service.update(companyId, dto);
  }
}

// 集团级别的公司管理（GROUP_ADMIN专用）
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
export class CompaniesManagementController {
  constructor(private readonly service: CompaniesService) {}

  // 创建子公司
  @Post()
  create(@Body() dto: CreateCompanyDto, @CurrentUser('groupId') groupId: string) {
    return this.service.create(dto, groupId);
  }

  // 获取集团下所有子公司
  @Get()
  findAll(@Query() query: CompanyQueryDto, @CurrentUser('groupId') groupId: string) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    return this.service.findAll(groupId, page, limit, query.search);
  }

  // 获取指定子公司详情
  @Get(':id')
  findOneById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('groupId') groupId: string) {
    return this.service.findOneById(id, groupId);
  }

  // 更新指定子公司
  @Put(':id')
  updateById(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCompanyDto, @CurrentUser('groupId') groupId: string) {
    return this.service.updateById(id, dto, groupId);
  }

  // 删除子公司（软删除）
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('groupId') groupId: string) {
    return this.service.remove(id, groupId);
  }
}
