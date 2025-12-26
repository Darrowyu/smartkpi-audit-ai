import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AssessmentService } from './assessment.service';
import { AssignmentService } from './services/assignment.service';
import { ExcelTemplateService } from './services/excel-template.service';
import {
  CreatePeriodDto,
  UpdatePeriodDto,
  QueryPeriodDto,
  CreateSubmissionDto,
  BulkDataEntryDto,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  BulkAssignmentDto,
  QueryAssignmentDto,
} from './dto';

@Controller('assessment')
@UseGuards(JwtAuthGuard)
export class AssessmentController {
  constructor(
    private readonly assessmentService: AssessmentService,
    private readonly assignmentService: AssignmentService,
    private readonly excelTemplateService: ExcelTemplateService,
    @InjectQueue('excel-import') private excelImportQueue: Queue,
  ) { }

  // ==================== Period 考核周期 ====================

  @Post('periods')
  async createPeriod(@Body() dto: CreatePeriodDto, @Request() req: any) {
    return this.assessmentService.createPeriod(
      dto,
      req.user.companyId,
      req.user.userId,
    );
  }

  @Get('periods')
  async findPeriods(@Query() query: QueryPeriodDto, @Request() req: any) {
    return this.assessmentService.findPeriods(query, req.user.companyId);
  }

  @Put('periods/:id')
  async updatePeriod(
    @Param('id') id: string,
    @Body() dto: UpdatePeriodDto,
    @Request() req: any,
  ) {
    return this.assessmentService.updatePeriod(id, dto, req.user.companyId);
  }

  @Post('periods/:id/lock')
  async lockPeriod(@Param('id') id: string, @Request() req: any) {
    return this.assessmentService.lockPeriod(id, req.user.companyId);
  }

  @Post('periods/:id/activate')
  async activatePeriod(@Param('id') id: string, @Request() req: any) {
    return this.assessmentService.activatePeriod(id, req.user.companyId);
  }

  @Delete('periods/:id')
  async deletePeriod(@Param('id') id: string, @Request() req: any) {
    return this.assessmentService.deletePeriod(id, req.user.companyId);
  }

  // ==================== Template 模板管理 ====================

  /** 下载 KPI 填报模板 */
  @Get('template/:periodId')
  async downloadTemplate(
    @Param('periodId') periodId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const buffer = await this.excelTemplateService.generateTemplate(
      periodId,
      req.user.companyId,
    );
    const filename = `KPI_Template_${periodId}.xlsx`;
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
  }

  /** 上传 Excel 数据 */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadData(
    @UploadedFile() file: Express.Multer.File,
    @Body('periodId') periodId: string,
    @Request() req: any,
  ) {
    if (!file) throw new BadRequestException('请上传文件');
    if (!periodId) throw new BadRequestException('请指定考核周期');

    const submission = await this.assessmentService.createSubmission(
      {
        // 创建数据提交记录
        periodId,
        dataSource: 'excel',
      },
      req.user.companyId,
      req.user.userId,
    );

    const job = await this.excelImportQueue.add({
      // 加入异步处理队列
      fileBuffer: file.buffer.toString('base64'),
      periodId,
      companyId: req.user.companyId,
      userId: req.user.userId,
      submissionId: submission.id,
    });

    return {
      jobId: job.id,
      submissionId: submission.id,
      message: '文件已上传，正在处理中',
    };
  }

  /** 同步解析 Excel（用于小文件或调试） */
  @Post('parse')
  @UseInterceptors(FileInterceptor('file'))
  async parseExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body('periodId') periodId: string,
    @Request() req: any,
  ) {
    if (!file) throw new BadRequestException('请上传文件');

    const result = await this.excelTemplateService.parseUploadedExcel(
      file.buffer,
      periodId,
      req.user.companyId,
    );
    return result;
  }

  // ==================== Submission 数据提交 ====================

  @Post('submissions')
  async createSubmission(
    @Body() dto: CreateSubmissionDto,
    @Request() req: any,
  ) {
    return this.assessmentService.createSubmission(
      dto,
      req.user.companyId,
      req.user.userId,
    );
  }

  @Get('submissions')
  async getSubmissions(@Query('periodId') periodId: string, @Request() req: any) {
    return this.assessmentService.findSubmissions(periodId, req.user.companyId);
  }

  @Get('submissions/:id')
  async getSubmission(@Param('id') id: string, @Request() req: any) {
    return this.assessmentService.getSubmissionEntries(id, req.user.companyId);
  }

  @Post('submissions/:id/submit')
  async submitForApproval(@Param('id') id: string, @Request() req: any) {
    return this.assessmentService.submitForApproval(
      id,
      req.user.companyId,
      req.user.userId,
    );
  }

  @Post('submissions/:id/approve')
  async approveSubmission(@Param('id') id: string, @Request() req: any) {
    return this.assessmentService.approveSubmission(
      id,
      req.user.companyId,
      req.user.userId,
    );
  }

  @Post('submissions/:id/reject')
  async rejectSubmission(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    return this.assessmentService.rejectSubmission(
      id,
      reason,
      req.user.companyId,
      req.user.userId,
    );
  }

  // ==================== Data Entry 数据录入 ====================

  @Post('entries/bulk')
  async bulkCreateEntries(@Body() dto: BulkDataEntryDto, @Request() req: any) {
    return this.assessmentService.bulkCreateEntries(
      dto.submissionId,
      dto.entries,
      req.user.companyId,
    );
  }

  @Put('entries/:id')
  async updateEntry(
    @Param('id') id: string,
    @Body() body: { actualValue: number; remark?: string },
    @Request() req: any,
  ) {
    return this.assessmentService.updateEntry(
      id,
      body.actualValue,
      body.remark,
      req.user.companyId,
    );
  }

  // ==================== Assignment 指标分配 ====================

  @Post('assignments')
  async createAssignment(
    @Body() dto: CreateAssignmentDto,
    @Request() req: any,
  ) {
    return this.assignmentService.create(dto, req.user.companyId);
  }

  @Post('assignments/bulk')
  async bulkCreateAssignments(
    @Body() dto: BulkAssignmentDto,
    @Request() req: any,
  ) {
    return this.assignmentService.bulkCreate(dto, req.user.companyId);
  }

  @Get('assignments')
  async findAssignments(
    @Query() query: QueryAssignmentDto,
    @Request() req: any,
  ) {
    return this.assignmentService.findAll(query, req.user.companyId);
  }

  @Get('assignments/period/:periodId')
  async findByPeriod(@Param('periodId') periodId: string, @Request() req: any) {
    return this.assignmentService.findByPeriod(periodId, req.user.companyId);
  }

  @Get('assignments/departments/:periodId')
  async getDepartmentAssignments(
    @Param('periodId') periodId: string,
    @Request() req: any,
  ) {
    return this.assignmentService.getDepartmentAssignments(
      periodId,
      req.user.companyId,
    );
  }

  @Put('assignments/:id')
  async updateAssignment(
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentDto,
    @Request() req: any,
  ) {
    return this.assignmentService.update(id, dto, req.user.companyId);
  }

  @Delete('assignments/:id')
  async removeAssignment(@Param('id') id: string, @Request() req: any) {
    return this.assignmentService.remove(id, req.user.companyId);
  }

  @Post('assignments/copy')
  async copyAssignments(
    @Body() body: { sourcePeriodId: string; targetPeriodId: string },
    @Request() req: any,
  ) {
    return this.assignmentService.copyFromPeriod(
      body.sourcePeriodId,
      body.targetPeriodId,
      req.user.companyId,
    );
  }
}
