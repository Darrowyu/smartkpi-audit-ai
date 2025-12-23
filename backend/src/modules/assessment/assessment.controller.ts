import { Controller, Get, Post, Put, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AssessmentService } from './assessment.service';
import { CreatePeriodDto, UpdatePeriodDto, QueryPeriodDto, CreateSubmissionDto, BulkDataEntryDto } from './dto';

@Controller('assessment')
@UseGuards(JwtAuthGuard)
export class AssessmentController {
    constructor(private readonly assessmentService: AssessmentService) { }

    // ==================== Period 考核周期 ====================

    @Post('periods')
    async createPeriod(@Body() dto: CreatePeriodDto, @Request() req: any) {
        return this.assessmentService.createPeriod(dto, req.user.companyId, req.user.sub);
    }

    @Get('periods')
    async findPeriods(@Query() query: QueryPeriodDto, @Request() req: any) {
        return this.assessmentService.findPeriods(query, req.user.companyId);
    }

    @Put('periods/:id')
    async updatePeriod(@Param('id') id: string, @Body() dto: UpdatePeriodDto, @Request() req: any) {
        return this.assessmentService.updatePeriod(id, dto, req.user.companyId);
    }

    @Post('periods/:id/lock')
    async lockPeriod(@Param('id') id: string, @Request() req: any) {
        return this.assessmentService.lockPeriod(id, req.user.companyId);
    }

    // ==================== Submission 数据提交 ====================

    @Post('submissions')
    async createSubmission(@Body() dto: CreateSubmissionDto, @Request() req: any) {
        return this.assessmentService.createSubmission(dto, req.user.companyId, req.user.sub);
    }

    @Get('submissions/:id')
    async getSubmission(@Param('id') id: string, @Request() req: any) {
        return this.assessmentService.getSubmissionEntries(id, req.user.companyId);
    }

    @Post('submissions/:id/submit')
    async submitForApproval(@Param('id') id: string, @Request() req: any) {
        return this.assessmentService.submitForApproval(id, req.user.companyId, req.user.sub);
    }

    @Post('submissions/:id/approve')
    async approveSubmission(@Param('id') id: string, @Request() req: any) {
        return this.assessmentService.approveSubmission(id, req.user.companyId, req.user.sub);
    }

    @Post('submissions/:id/reject')
    async rejectSubmission(@Param('id') id: string, @Body('reason') reason: string, @Request() req: any) {
        return this.assessmentService.rejectSubmission(id, reason, req.user.companyId, req.user.sub);
    }

    // ==================== Data Entry 数据录入 ====================

    @Post('entries/bulk')
    async bulkCreateEntries(@Body() dto: BulkDataEntryDto, @Request() req: any) {
        return this.assessmentService.bulkCreateEntries(dto.submissionId, dto.entries, req.user.companyId);
    }

    @Put('entries/:id')
    async updateEntry(@Param('id') id: string, @Body() body: { actualValue: number; remark?: string }, @Request() req: any) {
        return this.assessmentService.updateEntry(id, body.actualValue, body.remark, req.user.companyId);
    }
}
