import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { InterviewService } from './interview.service';

@Controller('interviews')
@UseGuards(JwtAuthGuard, TenantGuard)
export class InterviewController {
  constructor(private readonly service: InterviewService) {}

  @Post()
  scheduleInterview(@Request() req, @Body() dto: { periodId: string; employeeId: string; scheduledAt: Date }) {
    return this.service.scheduleInterview(req.user.companyId, req.user.id, dto);
  }

  @Get()
  getInterviews(@Request() req, @Query('periodId') periodId?: string, @Query('status') status?: string) {
    return this.service.getInterviews(req.user.companyId, periodId, status);
  }

  @Get('my')
  getMyInterviews(@Request() req) {
    return this.service.getMyInterviews(req.user.id, req.user.companyId);
  }

  @Get('pending-confirmations')
  getPendingConfirmations(@Request() req) {
    return this.service.getPendingConfirmations(req.user.companyId);
  }

  @Get(':id')
  getInterviewDetail(@Param('id') id: string) {
    return this.service.getInterviewDetail(id);
  }

  @Put(':id/conduct')
  conductInterview(@Request() req, @Param('id') id: string, @Body() dto: { summary: string; strengths?: string; improvements?: string; goals?: string }) {
    return this.service.conductInterview(id, req.user.id, dto);
  }

  @Put(':id/confirm')
  employeeConfirm(@Request() req, @Param('id') id: string, @Body() dto: { feedback?: string }) {
    return this.service.employeeConfirm(id, req.user.id, dto.feedback);
  }
}
