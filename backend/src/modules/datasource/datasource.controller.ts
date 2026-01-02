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
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DataSourceService } from './datasource.service';
import type { Prisma } from '@prisma/client';

@Controller('datasources')
@UseGuards(JwtAuthGuard)
export class DataSourceController {
  constructor(private readonly service: DataSourceService) {}

  @Permission('datasource:create')
  @Post()
  createDataSource(
    @CurrentUser('companyId') companyId: string,
    @Body()
    dto: {
      name: string;
      type: string;
      connectionConfig: Record<string, unknown>;
      fieldMapping: Prisma.InputJsonValue;
      syncFrequency?: string;
    },
  ) {
    return this.service.createDataSource(companyId, dto);
  }

  @Permission('datasource:view')
  @Get()
  getDataSources(@CurrentUser('companyId') companyId: string) {
    return this.service.getDataSources(companyId);
  }

  @Permission('datasource:view')
  @Get('logs')
  getSyncLogs(
    @CurrentUser('companyId') companyId: string,
    @Query('dataSourceId') dataSourceId?: string,
  ) {
    return this.service.getSyncLogs(companyId, dataSourceId);
  }

  @Permission('datasource:view')
  @Get('logs/:logId')
  getSyncStatus(
    @CurrentUser('companyId') companyId: string,
    @Param('logId') logId: string,
  ) {
    return this.service.getSyncStatus(logId, companyId);
  }

  @Permission('datasource:view')
  @Get(':id')
  getDataSource(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.getDataSource(id, companyId);
  }

  @Permission('datasource:edit')
  @Put(':id')
  updateDataSource(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body()
    dto: Partial<{
      name: string;
      connectionConfig: Record<string, unknown>;
      fieldMapping: Prisma.InputJsonValue;
      syncFrequency: string;
      isActive: boolean;
    }>,
  ) {
    return this.service.updateDataSource(id, companyId, dto);
  }

  @Permission('datasource:delete')
  @Delete(':id')
  deleteDataSource(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteDataSource(id, companyId);
  }

  @Permission('datasource:view')
  @Post(':id/test')
  testConnection(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.testConnection(id, companyId);
  }

  @Permission('datasource:edit')
  @Post(':id/sync')
  triggerSync(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.triggerSync(id, companyId);
  }
}
