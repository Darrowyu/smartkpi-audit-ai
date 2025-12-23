import { Module } from '@nestjs/common';
import { KpiAnalysisController } from './kpi-analysis.controller';
import { KpiAnalysisService } from './kpi-analysis.service';
import { GeminiClientService } from './services/gemini-client.service';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [FilesModule],
  controllers: [KpiAnalysisController],
  providers: [KpiAnalysisService, GeminiClientService],
  exports: [KpiAnalysisService],
})
export class KpiAnalysisModule {}
