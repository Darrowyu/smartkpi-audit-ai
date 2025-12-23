import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { KpiAnalysisService } from './kpi-analysis.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnalyzeDto, AnalysisQueryDto } from './dto/analyze.dto';

@Controller('kpi-analysis')
@UseGuards(JwtAuthGuard, TenantGuard)
export class KpiAnalysisController {
  constructor(private readonly kpiAnalysisService: KpiAnalysisService) {}

  @Post('analyze/:fileId') // POST /api/kpi-analysis/analyze/:fileId - 触发KPI分析
  async analyzeFile(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Body() analyzeDto: AnalyzeDto,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const language = (analyzeDto.language as 'en' | 'zh') || 'en';
    return this.kpiAnalysisService.analyzeFile(fileId, companyId, userId, language, analyzeDto.period);
  }

  @Get() // GET /api/kpi-analysis - 获取分析历史（分页）
  async getAnalyses(
    @Query() query: AnalysisQueryDto,
    @CurrentUser('companyId') companyId: string,
  ) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    return this.kpiAnalysisService.getAnalyses(companyId, page, limit, query.period);
  }

  @Get(':id') // GET /api/kpi-analysis/:id - 获取单个分析详情
  async getAnalysis(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.kpiAnalysisService.getAnalysisById(id, companyId);
  }

  @Delete(':id') // DELETE /api/kpi-analysis/:id - 删除分析
  async deleteAnalysis(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.kpiAnalysisService.deleteAnalysis(id, companyId);
  }
}
