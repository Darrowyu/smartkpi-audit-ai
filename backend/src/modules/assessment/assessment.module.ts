import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { AssignmentService } from './services/assignment.service';
import { ExcelTemplateService } from './services/excel-template.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: 'excel-import' })],
  controllers: [AssessmentController],
  providers: [AssessmentService, AssignmentService, ExcelTemplateService],
  exports: [AssessmentService, AssignmentService, ExcelTemplateService],
})
export class AssessmentModule {}
