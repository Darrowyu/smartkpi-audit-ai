import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeQueryDto,
  BulkImportDto,
} from './dto/employee.dto';

@Controller('employees')
@UseGuards(JwtAuthGuard, TenantGuard)
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Post()
  create(
    @Body() dto: CreateEmployeeDto,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.service.create(dto, companyId);
  }

  @Post('import')
  bulkImport(
    @Body() dto: BulkImportDto,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.service.bulkImport(dto.employees, companyId);
  }

  @Get()
  findAll(
    @Query() query: EmployeeQueryDto,
    @CurrentUser('companyId') companyId: string,
  ) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    return this.service.findAll(
      companyId,
      page,
      limit,
      query.search,
      query.departmentId,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.service.findOne(id, companyId);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.service.update(id, dto, companyId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.service.remove(id, companyId);
  }
}
