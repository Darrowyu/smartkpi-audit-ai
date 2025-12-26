import { Module } from '@nestjs/common';
import { DataSourceService } from './datasource.service';
import { DataSourceController } from './datasource.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DataSourceController],
  providers: [DataSourceService],
  exports: [DataSourceService],
})
export class DataSourceModule {}
