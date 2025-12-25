import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CalculationService } from './calculation.service';

@Controller('calculation')
@UseGuards(JwtAuthGuard)
export class CalculationController {
  constructor(private readonly calculationService: CalculationService) { }

  /** 触发异步计算任务 */
  @Post('trigger/:periodId')
  async triggerCalculation(
    @Param('periodId') periodId: string,
    @Request() req: any,
  ) {
    return this.calculationService.triggerCalculation(
      periodId,
      req.user.companyId,
      req.user.userId,
    );
  }

  /** 立即执行同步计算（小规模数据） */
  @Post('execute/:periodId')
  async executeCalculation(
    @Param('periodId') periodId: string,
    @Request() req: any,
  ) {
    return this.calculationService.executeCalculation(
      periodId,
      req.user.companyId,
      req.user.userId,
    );
  }

  /** 获取计算结果 */
  @Get('results/:periodId')
  async getPeriodResults(
    @Param('periodId') periodId: string,
    @Request() req: any,
  ) {
    return this.calculationService.getPeriodResults(
      periodId,
      req.user.companyId,
    );
  }

  /** 获取任务状态 */
  @Get('job/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.calculationService.getJobStatus(jobId);
  }
}
