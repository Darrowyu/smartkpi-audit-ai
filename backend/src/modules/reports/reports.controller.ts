import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permission } from '../../common/decorators/permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/interfaces/request-with-user.interface';
import { ReportsService } from './reports.service';
import { ExportService } from './export.service';
import { UserRole } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly exportService: ExportService,
  ) {}

  /** 获取周期绩效概览（角色感知） */
  @Permission('report:view')
  @Get('overview/:periodId')
  async getPeriodOverview(
    @Param('periodId') periodId: string,
    @CurrentUser() user: RequestUser,
  ) {
    const userContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
      departmentId: user.departmentId,
      linkedEmployeeId: user.linkedEmployeeId,
    };
    return this.reportsService.getPeriodOverview(
      periodId,
      user.companyId,
      userContext,
    );
  }

  /** 获取部门排名 */
  @Permission('report:view')
  @Get('departments/:periodId')
  async getDepartmentRanking(
    @Param('periodId') periodId: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.reportsService.getDepartmentRanking(periodId, companyId);
  }

  /** 获取员工排名（角色感知：USER 仅返回自己，MANAGER 返回部门） */
  @Permission('report:view')
  @Get('employees/:periodId')
  async getEmployeeRanking(
    @Param('periodId') periodId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @CurrentUser() user: RequestUser,
  ) {
    const userContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
      departmentId: user.departmentId,
      linkedEmployeeId: user.linkedEmployeeId,
    };
    return this.reportsService.getEmployeeRanking(
      periodId,
      user.companyId,
      +page || 1,
      +limit || 20,
      userContext,
    );
  }

  /** 获取员工详情（含雷达图数据） */
  @Permission('report:view')
  @Get('employee/:periodId/:employeeId')
  async getEmployeeDetail(
    @Param('periodId') periodId: string,
    @Param('employeeId') employeeId: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.reportsService.getEmployeeDetail(
      periodId,
      employeeId,
      companyId,
    );
  }

  /** 获取绩效趋势 */
  @Permission('report:view')
  @Get('trend')
  async getPerformanceTrend(
    @Query('periodCount') periodCount: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.reportsService.getPerformanceTrend(
      companyId,
      +periodCount || 6,
    );
  }

  /** 获取低绩效预警 */
  @Permission('report:view')
  @Get('alerts/:periodId')
  async getLowPerformanceAlerts(
    @Param('periodId') periodId: string,
    @Query('threshold') threshold: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.reportsService.getLowPerformanceAlerts(
      periodId,
      companyId,
      +threshold || 60,
    );
  }

  /** 获取集团级汇总（GROUP_ADMIN 权限） */
  @Permission('report:view')
  @Get('group-overview')
  @UseGuards(RolesGuard)
  @Roles(UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  async getGroupOverview(
    @Query('periodName') periodName: string,
    @CurrentUser('groupId') groupId: string,
  ) {
    return this.reportsService.getGroupOverview(groupId, periodName);
  }

  /** 导出员工绩效报表 */
  @Permission('report:export')
  @Get('export/employees/:periodId')
  async exportEmployees(
    @Param('periodId') periodId: string,
    @Query('format') format: 'xlsx' | 'csv',
    @CurrentUser('companyId') companyId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportEmployeePerformance({
      periodId,
      companyId,
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
  @Permission('report:export')
  @Get('export/departments/:periodId')
  async exportDepartments(
    @Param('periodId') periodId: string,
    @Query('format') format: 'xlsx' | 'csv',
    @CurrentUser('companyId') companyId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportDepartmentPerformance({
      periodId,
      companyId,
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
  @Permission('report:export')
  @Get('export/details/:periodId')
  async exportDetails(
    @Param('periodId') periodId: string,
    @Query('format') format: 'xlsx' | 'csv',
    @CurrentUser('companyId') companyId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportPerformanceDetails({
      periodId,
      companyId,
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
