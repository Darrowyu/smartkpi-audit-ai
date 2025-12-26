import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CheckInService } from './checkin.service';

@Controller('checkins')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CheckInController {
  constructor(private readonly service: CheckInService) {}

  @Post()
  createCheckIn(@Request() req, @Body() dto: { assignmentId: string; currentValue: number; notes?: string; attachments?: string[]; riskLevel?: string }) {
    const employeeId = req.user.linkedEmployeeId;
    return this.service.createCheckIn(req.user.companyId, employeeId, dto);
  }

  @Get()
  getCheckIns(@Request() req, @Query('assignmentId') assignmentId?: string, @Query('employeeId') employeeId?: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.service.getCheckIns(req.user.companyId, {
      assignmentId,
      employeeId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('my')
  getMyCheckIns(@Request() req, @Query('periodId') periodId?: string) {
    return this.service.getMyCheckIns(req.user.id, req.user.companyId, periodId);
  }

  @Get('summary')
  getProgressSummary(@Request() req, @Query('periodId') periodId: string) {
    return this.service.getProgressSummary(req.user.companyId, periodId);
  }

  @Get('alerts')
  getRiskAlerts(@Request() req) {
    return this.service.getRiskAlerts(req.user.companyId);
  }

  @Put(':id/feedback')
  addManagerFeedback(@Request() req, @Param('id') id: string, @Body() dto: { feedback: string }) {
    return this.service.addManagerFeedback(id, req.user.id, dto.feedback);
  }
}
