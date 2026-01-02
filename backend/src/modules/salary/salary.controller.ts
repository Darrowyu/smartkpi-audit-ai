import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { SalaryService } from './salary.service';

@Controller('salary')
@UseGuards(JwtAuthGuard, TenantGuard)
export class SalaryController {
  constructor(private readonly service: SalaryService) {}

  @Get('coefficients')
  getCoefficients(@Request() req) {
    return this.service.getCoefficients(req.user.companyId);
  }

  @Post('coefficients')
  saveCoefficients(
    @Request() req,
    @Body()
    dto: { coefficients: Record<string, number>; bonusBaseType?: string },
  ) {
    return this.service.saveCoefficients(req.user.companyId, dto);
  }

  @Post('calculate')
  calculateSalaries(
    @Request() req,
    @Body() dto: { periodId: string; baseBonusAmount?: number },
  ) {
    return this.service.calculateSalaries(
      req.user.companyId,
      dto.periodId,
      dto.baseBonusAmount,
    );
  }

  @Get('calculations')
  getSalaryCalculations(@Request() req, @Query('periodId') periodId: string) {
    return this.service.getSalaryCalculations(req.user.companyId, periodId);
  }

  @Get('export')
  async exportSalaryData(
    @Request() req,
    @Query('periodId') periodId: string,
    @Query('format') format: string,
    @Res() res: Response,
  ) {
    const data = await this.service.exportSalaryData(
      req.user.companyId,
      periodId,
      format,
    );

    if (format === 'csv') {
      const csv = this.convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=salary_${periodId}.csv`,
      );
      return res.send(csv);
    }

    return res.json(data);
  }

  @Get('summary')
  getSummary(@Request() req, @Query('periodId') periodId: string) {
    return this.service.getSummary(req.user.companyId, periodId);
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  }
}
