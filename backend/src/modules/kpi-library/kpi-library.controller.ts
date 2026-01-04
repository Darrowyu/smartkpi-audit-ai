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
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { KPILibraryService } from './kpi-library.service';
import {
  CreateKPIDefinitionDto,
  UpdateKPIDefinitionDto,
  QueryKPIDefinitionDto,
} from './dto';
import { UserRole } from '@prisma/client';

@Controller('kpi-library')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KPILibraryController {
  constructor(private readonly kpiLibraryService: KPILibraryService) {}

  /** 创建 KPI 指标 */
  @Post()
  @Roles(UserRole.MANAGER, UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() dto: CreateKPIDefinitionDto, @Request() req: any) {
    return this.kpiLibraryService.create(dto, req.user.companyId);
  }

  /** 获取指标列表 */
  @Get()
  @Roles(
    UserRole.USER,
    UserRole.MANAGER,
    UserRole.GROUP_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  async findAll(@Query() query: QueryKPIDefinitionDto, @Request() req: any) {
    return this.kpiLibraryService.findAll(
      query,
      req.user.companyId,
      req.user.groupId,
    );
  }

  /** 获取指标统计 */
  @Get('statistics')
  @Roles(UserRole.MANAGER, UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  async getStatistics(@Request() req: any) {
    return this.kpiLibraryService.getStatistics(
      req.user.companyId,
      req.user.groupId,
    );
  }

  /** 获取单个指标详情 */
  @Get(':id')
  @Roles(
    UserRole.USER,
    UserRole.MANAGER,
    UserRole.GROUP_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.kpiLibraryService.findOne(id, req.user.companyId);
  }

  /** 更新指标 */
  @Put(':id')
  @Roles(UserRole.MANAGER, UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateKPIDefinitionDto,
    @Request() req: any,
  ) {
    return this.kpiLibraryService.update(id, dto, req.user.companyId);
  }

  /** 删除指标 */
  @Delete(':id')
  @Roles(UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.kpiLibraryService.remove(id, req.user.companyId);
  }

  /** 批量导入指标 */
  @Post('bulk')
  @Roles(UserRole.MANAGER, UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  async bulkCreate(
    @Body() definitions: CreateKPIDefinitionDto[],
    @Request() req: any,
  ) {
    return this.kpiLibraryService.bulkCreate(definitions, req.user.companyId);
  }
}
