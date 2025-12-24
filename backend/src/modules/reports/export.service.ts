import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';

export interface ExportOptions {
  periodId: string;
  companyId: string;
  format: 'xlsx' | 'csv';
  includeDetails?: boolean; // 是否包含指标明细
}

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  /** 导出员工绩效报表 */
  async exportEmployeePerformance(options: ExportOptions): Promise<Buffer> {
    const { periodId, companyId, format, includeDetails } = options;

    const performances = await this.prisma.employeePerformance.findMany({
      where: { periodId, companyId },
      orderBy: { totalScore: 'desc' },
    });

    const employeeIds = performances.map((p) => p.employeeId);
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      include: { department: true },
    });

    const empMap = new Map(employees.map((e) => [e.id, e]));

    const data = performances.map((p, index) => {
      // 构建导出数据
      const emp = empMap.get(p.employeeId);
      return {
        排名: index + 1,
        员工ID: emp?.employeeId || '',
        姓名: emp?.name || '',
        部门: emp?.department?.name || '',
        总分: Math.round(p.totalScore * 100) / 100,
        等级: this.translateStatus(p.status),
      };
    });

    return this.generateExcel(data, format, '员工绩效报表');
  }

  /** 导出部门绩效报表 */
  async exportDepartmentPerformance(options: ExportOptions): Promise<Buffer> {
    const { periodId, companyId, format } = options;

    const deptPerfs = await this.prisma.departmentPerformance.findMany({
      where: { periodId, companyId },
      orderBy: { totalScore: 'desc' },
    });

    const deptIds = deptPerfs.map((d) => d.departmentId);
    const departments = await this.prisma.department.findMany({
      where: { id: { in: deptIds } },
    });

    const deptMap = new Map(departments.map((d) => [d.id, d.name]));

    const data = deptPerfs.map((d, index) => ({
      排名: index + 1,
      部门: deptMap.get(d.departmentId) || '',
      平均分: Math.round(d.totalScore * 100) / 100,
      员工数: d.employeeCount,
      计算方式: this.translateRollupMethod(d.rollupMethod),
    }));

    return this.generateExcel(data, format, '部门绩效报表');
  }

  /** 导出完整绩效明细 */
  async exportPerformanceDetails(options: ExportOptions): Promise<Buffer> {
    const { periodId, companyId, format } = options;

    const entries = await this.prisma.kPIDataEntry.findMany({
      where: { submission: { periodId, companyId } },
      include: {
        assignment: { include: { kpiDefinition: true } },
      },
    });

    const employeeIds = [...new Set(entries.map((e) => e.employeeId))];
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      include: { department: true },
    });

    const empMap = new Map(employees.map((e) => [e.id, e]));

    const data = entries.map((e) => {
      const emp = empMap.get(e.employeeId);
      return {
        员工ID: emp?.employeeId || '',
        姓名: emp?.name || '',
        部门: emp?.department?.name || '',
        指标: e.assignment.kpiDefinition.name,
        目标值: e.assignment.targetValue,
        实际值: e.actualValue,
        原始分: e.rawScore ?? '',
        得分: e.cappedScore ?? '',
        加权分: e.weightedScore ?? '',
      };
    });

    return this.generateExcel(data, format, '绩效明细');
  }

  private generateExcel(
    data: Record<string, any>[],
    format: 'xlsx' | 'csv',
    sheetName: string,
  ): Buffer {
    const ws = XLSX.utils.json_to_sheet(data);

    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length * 2, 10),
    })); // 自动列宽
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      return Buffer.from('\uFEFF' + csv, 'utf-8'); // BOM for Excel中文兼容
    }

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  private translateStatus(status: string): string {
    const map: Record<string, string> = {
      EXCELLENT: '优秀',
      GOOD: '良好',
      AVERAGE: '一般',
      POOR: '待改进',
    };
    return map[status] || status;
  }

  private translateRollupMethod(method: string): string {
    const map: Record<string, string> = {
      AVERAGE: '全员平均',
      WEIGHTED_AVERAGE: '加权平均',
      LEADER_SCORE: '负责人得分',
      SUM: '求和',
    };
    return map[method] || method;
  }
}
