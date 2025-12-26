import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DataSourceService } from './datasource.service';

@Controller('datasources')
@UseGuards(JwtAuthGuard)
export class DataSourceController {
  constructor(private readonly service: DataSourceService) {}

  @Post()
  createDataSource(@Request() req, @Body() dto: { name: string; type: string; connectionConfig: Record<string, any>; fieldMapping: Record<string, any>; syncFrequency?: string }) {
    return this.service.createDataSource(req.user.companyId, dto);
  }

  @Get()
  getDataSources(@Request() req) {
    return this.service.getDataSources(req.user.companyId);
  }

  @Get('logs')
  getSyncLogs(@Request() req, @Query('dataSourceId') dataSourceId?: string) {
    return this.service.getSyncLogs(req.user.companyId, dataSourceId);
  }

  @Get('logs/:logId')
  getSyncStatus(@Param('logId') logId: string) {
    return this.service.getSyncStatus(logId);
  }

  @Get(':id')
  getDataSource(@Param('id') id: string) {
    return this.service.getDataSource(id);
  }

  @Put(':id')
  updateDataSource(@Param('id') id: string, @Body() dto: Partial<{ name: string; connectionConfig: Record<string, any>; fieldMapping: Record<string, any>; syncFrequency: string; isActive: boolean }>) {
    return this.service.updateDataSource(id, dto);
  }

  @Delete(':id')
  deleteDataSource(@Param('id') id: string) {
    return this.service.deleteDataSource(id);
  }

  @Post(':id/test')
  testConnection(@Param('id') id: string) {
    return this.service.testConnection(id);
  }

  @Post(':id/sync')
  triggerSync(@Request() req, @Param('id') id: string) {
    return this.service.triggerSync(id, req.user.companyId);
  }
}
