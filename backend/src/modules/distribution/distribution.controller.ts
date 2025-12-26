import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { DistributionService } from './distribution.service';

@Controller('distribution')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DistributionController {
  constructor(private readonly service: DistributionService) {}

  @Get('config')
  getConfig(@Request() req, @Query('periodId') periodId?: string) {
    return this.service.getConfig(req.user.companyId, periodId);
  }

  @Post('config')
  saveConfig(@Request() req, @Body() dto: { periodId?: string; distribution: Record<string, number>; scoreBoundaries?: Record<string, number>; isEnforced?: boolean; tolerance?: number }) {
    return this.service.saveConfig(req.user.companyId, dto);
  }

  @Get('validate')
  validateDistribution(@Request() req, @Query('periodId') periodId: string) {
    return this.service.validateDistribution(req.user.companyId, periodId);
  }

  @Get('stats')
  getDistributionStats(@Request() req, @Query('periodId') periodId: string) {
    return this.service.getDistributionStats(req.user.companyId, periodId);
  }
}
