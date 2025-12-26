import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TalentService } from './talent.service';

@Controller('talent')
@UseGuards(JwtAuthGuard)
export class TalentController {
  constructor(private readonly service: TalentService) {}

  @Post('assess')
  assessPotential(@Request() req, @Body() dto: { employeeId: string; periodId: string; learningAgility: number; leadershipPotential: number; technicalDepth: number; collaborationSkill: number }) {
    return this.service.assessPotential(req.user.companyId, req.user.id, dto);
  }

  @Get('nine-box')
  getNineBoxData(@Request() req, @Query('periodId') periodId: string) {
    return this.service.getNineBoxData(req.user.companyId, periodId);
  }

  @Get('employee/:employeeId')
  getEmployeeAssessment(@Param('employeeId') employeeId: string, @Query('periodId') periodId: string) {
    return this.service.getEmployeeAssessment(employeeId, periodId);
  }

  @Get('employee/:employeeId/history')
  getAssessmentHistory(@Param('employeeId') employeeId: string) {
    return this.service.getAssessmentHistory(employeeId);
  }
}
