import { Module } from '@nestjs/common';
import { CompaniesController, CompaniesManagementController } from './companies.controller';
import { CompaniesService } from './companies.service';

@Module({
  controllers: [CompaniesController, CompaniesManagementController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
