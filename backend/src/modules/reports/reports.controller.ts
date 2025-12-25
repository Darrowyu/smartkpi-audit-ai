import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { ExportService } from './export.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly exportService: ExportService,
  ) { }

  /** 获取周期绩效概览（角色感知） */
  @Get('overview/:periodId')
  async getPeriodOverview(
    @Param('periodId') periodId: string,
    @Request() req: any,
  ) {
    const userContext = {
      userId: req.user.userId,
      role: req.user.role,
      companyId: req.user.companyId,
      departmentId: req.user.departmentId,
      linkedEmployeeId: req.user.linkedEmployeeId,
    };
    return this.reportsService.getPeriodOverview(
      periodId,
      req.user.companyId,
      userContext,
    );
  }

  /** 获取部门排名 */
  @Get('departments/:periodId')
  async getDepartmentRanking(
    @Param('periodId') periodId: string,
    @Request() req: any,
  ) {
    return this.reportsService.getDepartmentRanking(
      periodId,
      req.user.companyId,
    );
  }

  /** 获取员工排名（角色感知：USER 仅返回自己，MANAGER 返回部门） */
  @Get('employees/:periodId')
  async getEmployeeRanking(
    @Param('periodId') periodId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req: any,
  ) {
    const userContext = {
      userId: req.user.userId,
      role: req.user.role,
      companyId: req.user.companyId,
      departmentId: req.user.departmentId,
      linkedEmployeeId: req.user.linkedEmployeeId,
    };
    return this.reportsService.getEmployeeRanking(
      periodId,
      req.user.companyId,
      +page || 1,
      +limit || 20,
      userContext,
    );
  }

  /** 获取员工详情（含雷达图数据） */
  @Get('employee/:periodId/:employeeId')
  async getEmployeeDetail(
    @Param('periodId') periodId: string,
    @Param('employeeId') employeeId: string,
    @Request() req: any,
  ) {
    return this.reportsService.getEmployeeDetail(
      periodId,
      employeeId,
      req.user.companyId,
    );
  }

  /** 获取绩效趋势 */
  @Get('trend')
  async getPerformanceTrend(
    @Query('periodCount') periodCount: string,
    @Request() req: any,
  ) {
    return this.reportsService.getPerformanceTrend(
      req.user.companyId,
      +periodCount || 6,
    );
  }

  /** 获取低绩效预警 */
  @Get('alerts/:periodId')
  async getLowPerformanceAlerts(
    @Param('periodId') periodId: string,
    @Query('threshold') threshold: string,
    @Request() req: any,
  ) {
    return this.reportsService.getLowPerformanceAlerts(
      periodId,
      req.user.companyId,
      +threshold || 60,
    );
  }

  /** 获取集团级汇总（GROUP_ADMIN 权限） */
  @Get('group-overview')
  async getGroupOverview(
    @Query('periodName') periodName: string,
    @Request() req: any,
  ) {
    return this.reportsService.getGroupOverview(req.user.groupId, periodName);
  }

  /** 导出员工绩效报表 */
  @Get('export/employees/:periodId')
  async exportEmployees(
    @Param('periodId') periodId: string,
    @Query('format') format: 'xlsx' | 'csv',
    @Request() req: any,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportEmployeePerformance({
      periodId,
      companyId: req.user.companyId,
      format: format || 'xlsx',
    });

    const filename = `员工绩效报表_${Date.now()}.${format || 'xlsx'}`;
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
    res.setHeader(
      'Content-Type',
      format === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
  }

  /** 导出部门绩效报表 */
  @Get('export/departments/:periodId')
  async exportDepartments(
    @Param('periodId') periodId: string,
    @Query('format') format: 'xlsx' | 'csv',
    @Request() req: any,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportDepartmentPerformance({
      periodId,
      companyId: req.user.companyId,
      format: format || 'xlsx',
    });

    const filename = `部门绩效报表_${Date.now()}.${format || 'xlsx'}`;
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
    res.setHeader(
      'Content-Type',
      format === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
  }

  /** 导出绩效明细 */
  @Get('export/details/:periodId')
  async exportDetails(
    @Param('periodId') periodId: string,
    @Query('format') format: 'xlsx' | 'csv',
    @Request() req: any,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportPerformanceDetails({
      periodId,
      companyId: req.user.companyId,
      format: format || 'xlsx',
    });

    const filename = `绩效明细_${Date.now()}.${format || 'xlsx'}`;
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
    res.setHeader(
      'Content-Type',
      format === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
  }
}
