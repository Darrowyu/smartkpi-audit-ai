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
import { KPILibraryService } from './kpi-library.service';
import {
  CreateKPIDefinitionDto,
  UpdateKPIDefinitionDto,
  QueryKPIDefinitionDto,
} from './dto';

@Controller('kpi-library')
@UseGuards(JwtAuthGuard)
export class KPILibraryController {
  constructor(private readonly kpiLibraryService: KPILibraryService) {}

  /** 创建 KPI 指标 */
  @Post()
  async create(@Body() dto: CreateKPIDefinitionDto, @Request() req: any) {
    return this.kpiLibraryService.create(dto, req.user.companyId);
  }

  /** 获取指标列表 */
  @Get()
  async findAll(@Query() query: QueryKPIDefinitionDto, @Request() req: any) {
    return this.kpiLibraryService.findAll(
      query,
      req.user.companyId,
      req.user.groupId,
    );
  }

  /** 获取指标统计 */
  @Get('statistics')
  async getStatistics(@Request() req: any) {
    return this.kpiLibraryService.getStatistics(req.user.companyId);
  }

  /** 获取单个指标详情 */
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.kpiLibraryService.findOne(id, req.user.companyId);
  }

  /** 更新指标 */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateKPIDefinitionDto,
    @Request() req: any,
  ) {
    return this.kpiLibraryService.update(id, dto, req.user.companyId);
  }

  /** 删除指标 */
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.kpiLibraryService.remove(id, req.user.companyId);
  }

  /** 批量导入指标 */
  @Post('bulk')
  async bulkCreate(
    @Body() definitions: CreateKPIDefinitionDto[],
    @Request() req: any,
  ) {
    return this.kpiLibraryService.bulkCreate(definitions, req.user.companyId);
  }
}
