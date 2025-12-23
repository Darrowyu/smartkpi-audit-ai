import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as XLSX from 'xlsx';

export interface TemplateColumn {
    key: string;
    header: string;
    locked?: boolean; // 是否锁定（不可编辑）
}

@Injectable()
export class ExcelTemplateService {
    constructor(private prisma: PrismaService) { }

    /** 生成 KPI 填报模板 */
    async generateTemplate(periodId: string, companyId: string): Promise<Buffer> {
        const [period, assignments, employees] = await Promise.all([ // 获取周期和指标分配
            this.prisma.assessmentPeriod.findFirst({ where: { id: periodId, companyId } }),
            this.prisma.kPIAssignment.findMany({
                where: { periodId, companyId },
                include: { kpiDefinition: true },
            }),
            this.prisma.employee.findMany({
                where: { companyId, isActive: true },
                include: { department: true },
                orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
            }),
        ]);

        if (!period) throw new Error('考核周期不存在');

        const kpiColumns = assignments.map(a => a.kpiDefinition); // 构建表头

        const headers = [
            '员工ID', '员工姓名', '部门',
            ...kpiColumns.map(k => `${k.name}(目标: ${this.getTargetValue(assignments, k.id)})`),
        ];

        const data = employees.map(emp => { // 构建数据行
            const row: any[] = [
                emp.employeeId,
                emp.name,
                emp.department?.name || '',
            ];

            kpiColumns.forEach(() => row.push('')); // 填报列留空
            return row;
        });

        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]); // 创建工作表

        ws['!cols'] = [ // 设置列宽
            { wch: 15 }, { wch: 15 }, { wch: 20 },
            ...kpiColumns.map(() => ({ wch: 25 })),
        ];

        const wb = XLSX.utils.book_new(); // 创建工作簿
        XLSX.utils.book_append_sheet(wb, ws, `${period.name}填报模板`);

        const instructionWs = this.createInstructionSheet(period, kpiColumns); // 添加说明页
        XLSX.utils.book_append_sheet(wb, instructionWs, '填报说明');

        return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }

    /** 解析上传的 Excel 数据 */
    async parseUploadedExcel(buffer: Buffer, periodId: string, companyId: string) {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const assignments = await this.prisma.kPIAssignment.findMany({ // 获取当前周期的指标分配
            where: { periodId, companyId },
            include: { kpiDefinition: true },
        });

        const result: { employeeId: string; assignmentId: string; actualValue: number }[] = [];
        const errors: string[] = [];

        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i] as Record<string, any>;
            const employeeId = row['员工ID'];

            if (!employeeId) {
                errors.push(`第${i + 2}行：缺少员工ID`);
                continue;
            }

            const employee = await this.prisma.employee.findFirst({ // 验证员工是否存在
                where: { companyId, employeeId: String(employeeId) },
            });

            if (!employee) {
                errors.push(`第${i + 2}行：员工ID "${employeeId}" 不存在`);
                continue;
            }

            for (const assignment of assignments) { // 解析每个指标的值
                const kpiName = assignment.kpiDefinition.name;
                const columnKey = Object.keys(row).find(k => k.includes(kpiName));

                if (columnKey && row[columnKey] !== '') {
                    const value = parseFloat(row[columnKey]);

                    if (isNaN(value)) {
                        errors.push(`第${i + 2}行：指标"${kpiName}"的值不是有效数字`);
                    } else {
                        result.push({
                            employeeId: employee.id,
                            assignmentId: assignment.id,
                            actualValue: value,
                        });
                    }
                }
            }
        }

        return { data: result, errors, rowCount: jsonData.length };
    }

    private getTargetValue(assignments: any[], kpiId: string): string {
        const assignment = assignments.find(a => a.kpiDefinition.id === kpiId);
        return assignment ? String(assignment.targetValue) : '-';
    }

    private createInstructionSheet(period: any, kpis: any[]): XLSX.WorkSheet {
        const instructions = [
            ['KPI 填报说明'],
            [''],
            ['考核周期:', period.name],
            ['开始日期:', period.startDate.toLocaleDateString('zh-CN')],
            ['结束日期:', period.endDate.toLocaleDateString('zh-CN')],
            [''],
            ['填报注意事项:'],
            ['1. 请勿修改表头和员工信息列'],
            ['2. 只在指标列填写实际完成值'],
            ['3. 必须填写数字，不要包含单位'],
            ['4. 填写完成后保存为 .xlsx 格式上传'],
            [''],
            ['指标说明:'],
            ...kpis.map(k => [k.name, k.description || '无说明']),
        ];

        return XLSX.utils.aoa_to_sheet(instructions);
    }
}
