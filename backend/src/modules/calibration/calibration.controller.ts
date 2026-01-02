import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CalibrationService } from './calibration.service';

@Controller('calibration')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CalibrationController {
  constructor(private readonly service: CalibrationService) {}

  @Post('sessions')
  createSession(
    @Request() req,
    @Body() dto: { name: string; periodId: string; departmentIds: string[] },
  ) {
    return this.service.createSession(req.user.companyId, req.user.id, dto);
  }

  @Get('sessions')
  getSessions(@Request() req, @Query('periodId') periodId?: string) {
    return this.service.getSessions(req.user.companyId, periodId);
  }

  @Get('sessions/:id')
  getSessionDetail(@Param('id') id: string) {
    return this.service.getSessionDetail(id);
  }

  @Post('sessions/:id/adjust')
  adjustScore(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: { employeeId: string; adjustedScore: number; reason?: string },
  ) {
    return this.service.adjustScore(
      id,
      req.user.id,
      dto.employeeId,
      dto.adjustedScore,
      dto.reason,
    );
  }

  @Post('sessions/:id/batch-adjust')
  batchAdjust(
    @Request() req,
    @Param('id') id: string,
    @Body()
    dto: {
      adjustments: Array<{
        employeeId: string;
        adjustedScore: number;
        reason?: string;
      }>;
    },
  ) {
    return this.service.batchAdjust(id, req.user.id, dto.adjustments);
  }

  @Put('sessions/:id/start')
  startSession(@Param('id') id: string) {
    return this.service.startSession(id);
  }

  @Put('sessions/:id/complete')
  completeSession(@Param('id') id: string) {
    return this.service.completeSession(id);
  }
}
