import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KPIStatusEnum, UserRole } from '@prisma/client';

/** 用户上下文信息用于数据隔离 */
export interface UserContext {
    userId: string;
    role: UserRole;
    companyId: string;
    departmentId?: string | null;
    linkedEmployeeId?: string | null;
}

export interface PerformanceOverview {
    periodName: string;
    totalEmployees: number;
    avgScore: number;
    excellent: number;
    good: number;
    average: number;
    poor: number;
}

export interface DepartmentRanking {
    departmentId: string;
    departmentName: string;
    score: number;
    employeeCount: number;
    rank: number;
}

export interface EmployeeRanking {
    employeeId: string;
    employeeName: string;
    departmentName: string;
    score: number;
    status: KPIStatusEnum;
    rank: number;
}

export interface TrendData {
    period: string;
    avgScore: number;
    employeeCount: number;
}

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    /** 获取考核周期绩效概览（角色感知） */
    async getPeriodOverview(periodId: string, companyId: string, userContext?: UserContext): Promise<PerformanceOverview> {
        let whereClause: any = { periodId, companyId };

        if (userContext) { // 根据角色过滤数据
            if (userContext.role === UserRole.USER && userContext.linkedEmployeeId) {
                whereClause = { ...whereClause, employeeId: userContext.linkedEmployeeId };
            } else if (userContext.role === UserRole.MANAGER && userContext.departmentId) {
                whereClause = { ...whereClause, departmentId: userContext.departmentId };
            }
        }

        const [period, performances] = await Promise.all([
            this.prisma.assessmentPeriod.findFirst({ where: { id: periodId, companyId } }),
            this.prisma.employeePerformance.findMany({ where: whereClause }),
        ]);

        if (!period || performances.length === 0) {
            return { periodName: period?.name || '', totalEmployees: 0, avgScore: 0, excellent: 0, good: 0, average: 0, poor: 0 };
        }

        const scores = performances.map(p => p.totalScore);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        return {
            periodName: period.name,
            totalEmployees: performances.length,
            avgScore: Math.round(avgScore * 100) / 100,
            excellent: performances.filter(p => p.status === KPIStatusEnum.EXCELLENT).length,
            good: performances.filter(p => p.status === KPIStatusEnum.GOOD).length,
            average: performances.filter(p => p.status === KPIStatusEnum.AVERAGE).length,
            poor: performances.filter(p => p.status === KPIStatusEnum.POOR).length,
        };
    }

    /** 获取部门排名 */
    async getDepartmentRanking(periodId: string, companyId: string): Promise<DepartmentRanking[]> {
        const deptPerfs = await this.prisma.departmentPerformance.findMany({
            where: { periodId, companyId },
            orderBy: { totalScore: 'desc' },
        });

        const deptIds = deptPerfs.map(d => d.departmentId);
        const departments = await this.prisma.department.findMany({
            where: { id: { in: deptIds } },
        });

        const deptMap = new Map(departments.map(d => [d.id, d.name]));

        return deptPerfs.map((d, index) => ({
            departmentId: d.departmentId,
            departmentName: deptMap.get(d.departmentId) || 'Unknown',
            score: Math.round(d.totalScore * 100) / 100,
            employeeCount: d.employeeCount,
            rank: index + 1,
        }));
    }

    /** 获取员工排名（支持分页，角色感知数据过滤） */
    async getEmployeeRanking(periodId: string, companyId: string, page = 1, limit = 20, userContext?: UserContext): Promise<{ data: EmployeeRanking[]; total: number; isFiltered?: boolean }> {
        const skip = (page - 1) * limit;

        let whereClause: any = { periodId, companyId };
        let isFiltered = false;

        if (userContext) {
            if (userContext.role === UserRole.USER && userContext.linkedEmployeeId) { // USER角色：仅返回自己的绩效
                whereClause = { ...whereClause, employeeId: userContext.linkedEmployeeId };
                isFiltered = true;
            } else if (userContext.role === UserRole.MANAGER && userContext.departmentId) { // MANAGER角色：返回部门内员工
                whereClause = { ...whereClause, departmentId: userContext.departmentId };
                isFiltered = true;
            }
            // GROUP_ADMIN 和 SUPER_ADMIN 查看全公司数据，不过滤
        }

        const [performances, total] = await Promise.all([
            this.prisma.employeePerformance.findMany({
                where: whereClause,
                orderBy: { totalScore: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.employeePerformance.count({ where: whereClause }),
        ]);

        const employeeIds = performances.map(p => p.employeeId);
        const employees = await this.prisma.employee.findMany({
            where: { id: { in: employeeIds } },
            include: { department: true },
        });

        const empMap = new Map(employees.map(e => [e.id, e]));

        const data = performances.map((p, index) => {
            const emp = empMap.get(p.employeeId);
            return {
                employeeId: p.employeeId,
                employeeName: emp?.name || 'Unknown',
                departmentName: emp?.department?.name || 'Unknown',
                score: Math.round(p.totalScore * 100) / 100,
                status: p.status,
                rank: skip + index + 1,
            };
        });

        return { data, total, isFiltered };
    }

    /** 获取绩效趋势（多周期对比） */
    async getPerformanceTrend(companyId: string, periodCount = 6): Promise<TrendData[]> {
        const periods = await this.prisma.assessmentPeriod.findMany({
            where: { companyId },
            orderBy: { endDate: 'desc' },
            take: periodCount,
        });

        const trends: TrendData[] = [];

        for (const period of periods.reverse()) {
            const performances = await this.prisma.employeePerformance.findMany({
                where: { periodId: period.id, companyId },
            });

            if (performances.length > 0) {
                const avgScore = performances.reduce((sum, p) => sum + p.totalScore, 0) / performances.length;
                trends.push({
                    period: period.name,
                    avgScore: Math.round(avgScore * 100) / 100,
                    employeeCount: performances.length,
                });
            }
        }

        return trends;
    }

    /** 获取低绩效预警（得分低于阈值） */
    async getLowPerformanceAlerts(periodId: string, companyId: string, threshold = 60): Promise<EmployeeRanking[]> {
        const performances = await this.prisma.employeePerformance.findMany({
            where: { periodId, companyId, totalScore: { lt: threshold } },
            orderBy: { totalScore: 'asc' },
        });

        const employeeIds = performances.map(p => p.employeeId);
        const employees = await this.prisma.employee.findMany({
            where: { id: { in: employeeIds } },
            include: { department: true },
        });

        const empMap = new Map(employees.map(e => [e.id, e]));

        return performances.map((p, index) => {
            const emp = empMap.get(p.employeeId);
            return {
                employeeId: p.employeeId,
                employeeName: emp?.name || 'Unknown',
                departmentName: emp?.department?.name || 'Unknown',
                score: Math.round(p.totalScore * 100) / 100,
                status: p.status,
                rank: index + 1,
            };
        });
    }

    /** 获取集团级汇总（跨公司） */
    async getGroupOverview(groupId: string, periodName?: string) {
        const companies = await this.prisma.company.findMany({
            where: { groupId, isActive: true },
        });

        const results: (PerformanceOverview & { companyId: string; companyName: string })[] = [];

        for (const company of companies) {
            const period = await this.prisma.assessmentPeriod.findFirst({
                where: { companyId: company.id, ...(periodName && { name: { contains: periodName } }) },
                orderBy: { endDate: 'desc' },
            });

            if (period) {
                const overview = await this.getPeriodOverview(period.id, company.id);
                results.push({ companyId: company.id, companyName: company.name, ...overview });
            }
        }

        return results.sort((a, b) => b.avgScore - a.avgScore); // 按平均分排名
    }

    /** 获取员工详情（含雷达图数据） */
    async getEmployeeDetail(periodId: string, employeeId: string, companyId: string) {
        const performance = await this.prisma.employeePerformance.findFirst({
            where: { periodId, employeeId, companyId },
        });

        if (!performance) return null;

        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
            include: { department: true },
        });

        const entries = await this.prisma.kPIDataEntry.findMany({ // 获取该员工的所有指标得分
            where: {
                employeeId,
                submission: { periodId, companyId },
            },
            include: {
                assignment: { include: { kpiDefinition: true } },
            },
        });

        const metrics = entries.map(e => ({ // 构建雷达图数据
            name: e.assignment.kpiDefinition.name,
            score: e.cappedScore || 0,
            weight: e.assignment.weight,
            target: e.assignment.targetValue,
            actual: e.actualValue,
        }));

        return {
            employeeId: employee?.employeeId || '',
            employeeName: employee?.name || 'Unknown',
            departmentName: employee?.department?.name || 'Unknown',
            totalScore: Math.round(performance.totalScore * 100) / 100,
            status: performance.status,
            metrics,
        };
    }
}
