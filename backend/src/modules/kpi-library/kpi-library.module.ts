import { Module } from '@nestjs/common';
import { KPILibraryController } from './kpi-library.controller';
import { KPILibraryService } from './kpi-library.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { FormulaEngine } from '../calculation/engines/formula.engine';

@Module({
  imports: [PrismaModule],
  controllers: [KPILibraryController],
  providers: [KPILibraryService, FormulaEngine],
  exports: [KPILibraryService],
})
export class KPILibraryModule {}
