import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CalculationController } from './calculation.controller';
import { CalculationService } from './calculation.service';
import { FormulaEngine } from './engines/formula.engine';
import { RollupEngine } from './engines/rollup.engine';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [
        PrismaModule,
        BullModule.registerQueue({ name: 'kpi-calculation' }),
    ],
    controllers: [CalculationController],
    providers: [CalculationService, FormulaEngine, RollupEngine],
    exports: [CalculationService, FormulaEngine, RollupEngine],
})
export class CalculationModule { }
