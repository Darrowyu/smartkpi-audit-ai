import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExcelImportProcessor } from './processors/excel-import.processor';
import { CalculationProcessor } from './processors/calculation.processor';
import { PrismaModule } from '../../prisma/prisma.module';
import { AssessmentModule } from '../assessment/assessment.module';
import { CalculationModule } from '../calculation/calculation.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
          password: configService.get('REDIS_PASSWORD') || undefined,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'excel-import' }, // Excel导入队列
      { name: 'kpi-calculation' }, // KPI计算队列
    ),
    PrismaModule,
    AssessmentModule,
    CalculationModule,
    NotificationsModule,
  ],
  providers: [ExcelImportProcessor, CalculationProcessor],
  exports: [BullModule],
})
export class QueueModule {}
