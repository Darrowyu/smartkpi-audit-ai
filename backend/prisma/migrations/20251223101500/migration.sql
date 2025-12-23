/*
  Warnings:

  - You are about to drop the column `code` on the `departments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[group_id,code]` on the table `companies` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "FormulaType" AS ENUM ('POSITIVE', 'NEGATIVE', 'BINARY', 'STEPPED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AssessmentFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "PeriodStatus" AS ENUM ('DRAFT', 'ACTIVE', 'LOCKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RollupMethod" AS ENUM ('AVERAGE', 'WEIGHTED_AVERAGE', 'LEADER_SCORE', 'SUM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SUBMISSION_PENDING', 'SUBMISSION_APPROVED', 'SUBMISSION_REJECTED', 'CALCULATION_COMPLETE', 'PERIOD_ACTIVATED', 'PERIOD_LOCKED', 'LOW_PERFORMANCE_ALERT', 'ASSIGNMENT_CREATED', 'SYSTEM_ANNOUNCEMENT');

-- DropIndex
DROP INDEX "departments_company_id_code_key";

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "departments" DROP COLUMN "code";

-- CreateTable
CREATE TABLE "kpi_definitions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formula_type" "FormulaType" NOT NULL DEFAULT 'POSITIVE',
    "custom_formula" TEXT,
    "frequency" "AssessmentFrequency" NOT NULL DEFAULT 'MONTHLY',
    "default_weight" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "score_cap" DOUBLE PRECISION NOT NULL DEFAULT 120,
    "score_floor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scoring_rules" JSONB,
    "source_department" TEXT,
    "unit" TEXT,
    "group_id" TEXT,
    "company_id" TEXT,
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "kpi_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_periods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "lock_date" TIMESTAMP(3),
    "status" "PeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "company_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_assignments" (
    "id" TEXT NOT NULL,
    "kpi_definition_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "department_id" TEXT,
    "employee_id" TEXT,
    "target_value" DOUBLE PRECISION NOT NULL,
    "challenge_value" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_submissions" (
    "id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "department_id" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "data_source" TEXT NOT NULL DEFAULT 'manual',
    "file_id" TEXT,
    "submitted_by_id" TEXT,
    "submitted_at" TIMESTAMP(3),
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "reject_reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_data_entries" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "actual_value" DOUBLE PRECISION NOT NULL,
    "raw_score" DOUBLE PRECISION,
    "capped_score" DOUBLE PRECISION,
    "weighted_score" DOUBLE PRECISION,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_data_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_performances" (
    "id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "department_id" TEXT,
    "total_score" DOUBLE PRECISION NOT NULL,
    "status" "KPIStatusEnum" NOT NULL,
    "locked_dept_id" TEXT,
    "locked_dept_name" TEXT,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculated_by_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_performances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_performances" (
    "id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "total_score" DOUBLE PRECISION NOT NULL,
    "employee_count" INTEGER NOT NULL,
    "rollup_method" "RollupMethod" NOT NULL DEFAULT 'AVERAGE',
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_performances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_configs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "role_permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT,

    CONSTRAINT "permission_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "related_type" TEXT,
    "related_id" TEXT,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kpi_definitions_group_id_idx" ON "kpi_definitions"("group_id");

-- CreateIndex
CREATE INDEX "kpi_definitions_company_id_idx" ON "kpi_definitions"("company_id");

-- CreateIndex
CREATE INDEX "kpi_definitions_frequency_idx" ON "kpi_definitions"("frequency");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_definitions_company_id_code_key" ON "kpi_definitions"("company_id", "code");

-- CreateIndex
CREATE INDEX "assessment_periods_company_id_idx" ON "assessment_periods"("company_id");

-- CreateIndex
CREATE INDEX "assessment_periods_status_idx" ON "assessment_periods"("status");

-- CreateIndex
CREATE INDEX "assessment_periods_start_date_end_date_idx" ON "assessment_periods"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "kpi_assignments_period_id_idx" ON "kpi_assignments"("period_id");

-- CreateIndex
CREATE INDEX "kpi_assignments_company_id_idx" ON "kpi_assignments"("company_id");

-- CreateIndex
CREATE INDEX "kpi_assignments_department_id_idx" ON "kpi_assignments"("department_id");

-- CreateIndex
CREATE INDEX "kpi_assignments_employee_id_idx" ON "kpi_assignments"("employee_id");

-- CreateIndex
CREATE INDEX "data_submissions_period_id_idx" ON "data_submissions"("period_id");

-- CreateIndex
CREATE INDEX "data_submissions_company_id_idx" ON "data_submissions"("company_id");

-- CreateIndex
CREATE INDEX "data_submissions_status_idx" ON "data_submissions"("status");

-- CreateIndex
CREATE INDEX "data_submissions_version_idx" ON "data_submissions"("version");

-- CreateIndex
CREATE INDEX "kpi_data_entries_submission_id_idx" ON "kpi_data_entries"("submission_id");

-- CreateIndex
CREATE INDEX "kpi_data_entries_assignment_id_idx" ON "kpi_data_entries"("assignment_id");

-- CreateIndex
CREATE INDEX "kpi_data_entries_employee_id_idx" ON "kpi_data_entries"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_data_entries_submission_id_assignment_id_employee_id_key" ON "kpi_data_entries"("submission_id", "assignment_id", "employee_id");

-- CreateIndex
CREATE INDEX "employee_performances_period_id_idx" ON "employee_performances"("period_id");

-- CreateIndex
CREATE INDEX "employee_performances_company_id_idx" ON "employee_performances"("company_id");

-- CreateIndex
CREATE INDEX "employee_performances_department_id_idx" ON "employee_performances"("department_id");

-- CreateIndex
CREATE INDEX "employee_performances_status_idx" ON "employee_performances"("status");

-- CreateIndex
CREATE UNIQUE INDEX "employee_performances_period_id_employee_id_key" ON "employee_performances"("period_id", "employee_id");

-- CreateIndex
CREATE INDEX "department_performances_period_id_idx" ON "department_performances"("period_id");

-- CreateIndex
CREATE INDEX "department_performances_company_id_idx" ON "department_performances"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "department_performances_period_id_department_id_key" ON "department_performances"("period_id", "department_id");

-- CreateIndex
CREATE UNIQUE INDEX "permission_configs_company_id_key" ON "permission_configs"("company_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_company_id_idx" ON "notifications"("company_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "companies_group_id_code_key" ON "companies"("group_id", "code");

-- AddForeignKey
ALTER TABLE "kpi_assignments" ADD CONSTRAINT "kpi_assignments_kpi_definition_id_fkey" FOREIGN KEY ("kpi_definition_id") REFERENCES "kpi_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_assignments" ADD CONSTRAINT "kpi_assignments_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "assessment_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_submissions" ADD CONSTRAINT "data_submissions_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "assessment_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_data_entries" ADD CONSTRAINT "kpi_data_entries_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "data_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_data_entries" ADD CONSTRAINT "kpi_data_entries_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "kpi_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
