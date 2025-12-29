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
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentQueryDto,
} from './dto/department.dto';
import { UserRole } from '@prisma/client';

@Controller('departments')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}

  @Post()
  @Roles(UserRole.MANAGER, UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  create(
    @Body() dto: CreateDepartmentDto,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.service.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.USER, UserRole.MANAGER, UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  findAll(
    @Query() query: DepartmentQueryDto,
    @CurrentUser('companyId') companyId: string,
  ) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    return this.service.findAll(companyId, page, limit, query.search);
  }

  @Get(':id')
  @Roles(UserRole.USER, UserRole.MANAGER, UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.service.findOne(id, companyId);
  }

  @Put(':id')
  @Roles(UserRole.MANAGER, UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.service.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.service.remove(id, companyId);
  }
}
