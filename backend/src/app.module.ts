import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { FilesModule } from './modules/files/files.module';
import { KpiAnalysisModule } from './modules/kpi-analysis/kpi-analysis.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { GroupsModule } from './modules/groups/groups.module';
// NEW: KPI System Modules
import { QueueModule } from './modules/queue/queue.module';
import { KPILibraryModule } from './modules/kpi-library/kpi-library.module';
import { AssessmentModule } from './modules/assessment/assessment.module';
import { CalculationModule } from './modules/calculation/calculation.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    AuthModule,
    FilesModule,
    KpiAnalysisModule,
    DepartmentsModule,
    EmployeesModule,
    UsersModule,
    CompaniesModule,
    GroupsModule,
    // NEW: KPI System Modules
    QueueModule,
    KPILibraryModule,
    AssessmentModule,
    CalculationModule,
    ReportsModule,
    PermissionsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
