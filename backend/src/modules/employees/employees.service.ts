import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto, BulkImportEmployeeDto } from './dto/employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateEmployeeDto, companyId: string) {
    const existing = await this.prisma.employee.findFirst({
      where: { companyId, employeeId: dto.employeeId },
    });
    if (existing) throw new ConflictException('Employee ID already exists');

    return this.prisma.employee.create({
      data: { ...dto, companyId },
      include: { department: { select: { id: true, name: true } } },
    });
  }

  async findAll(companyId: string, page = 1, limit = 20, search?: string, departmentId?: string) {
    const skip = (page - 1) * limit;
    const where = {
      companyId,
      isActive: true,
      ...(departmentId && { departmentId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { employeeId: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { department: { select: { id: true, name: true } } },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, companyId: string) {
    const emp = await this.prisma.employee.findFirst({
      where: { id, companyId },
      include: { department: true, kpiRecords: { take: 5, orderBy: { createdAt: 'desc' } } },
    });
    if (!emp) throw new NotFoundException('Employee not found');
    return emp;
  }

  async update(id: string, dto: UpdateEmployeeDto, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.employee.update({
      where: { id },
      data: dto,
      include: { department: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.employee.update({ where: { id }, data: { isActive: false } });
    return { message: 'Employee deleted' };
  }

  /** 批量导入员工 */
  async bulkImport(employees: BulkImportEmployeeDto[], companyId: string) {
    const results = { created: 0, updated: 0, errors: [] as string[] };

    // 获取部门映射（使用 name 进行匹配）
    const departments = await this.prisma.department.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true },
    });
    const deptMap = new Map(departments.map((d) => [d.name?.toUpperCase(), d.id]));

    for (const emp of employees) {
      try {
        const departmentId = emp.departmentCode ? deptMap.get(emp.departmentCode.toUpperCase()) : undefined;

        const existing = await this.prisma.employee.findFirst({
          where: { companyId, employeeId: emp.employeeId },
        });

        if (existing) {
          await this.prisma.employee.update({
            where: { id: existing.id },
            data: { name: emp.name, email: emp.email, role: emp.role, departmentId, isActive: true },
          });
          results.updated++;
        } else {
          await this.prisma.employee.create({
            data: { employeeId: emp.employeeId, name: emp.name, email: emp.email, role: emp.role, departmentId, companyId },
          });
          results.created++;
        }
      } catch (e) {
        results.errors.push(`${emp.employeeId}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }

    return results;
  }
}
