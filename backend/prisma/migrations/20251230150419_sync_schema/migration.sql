-- CreateEnum
CREATE TYPE "ApprovalStage" AS ENUM ('SELF_EVAL', 'MANAGER_REVIEW', 'SKIP_LEVEL', 'HR_CONFIRM', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('SUBMIT', 'APPROVE', 'REJECT', 'RETURN');

-- CreateEnum
CREATE TYPE "PerformanceGrade" AS ENUM ('S', 'A', 'B', 'C', 'D');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'APPROVAL_PENDING';
ALTER TYPE "NotificationType" ADD VALUE 'APPROVAL_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'INTERVIEW_SCHEDULED';
ALTER TYPE "NotificationType" ADD VALUE 'CHECKIN_REMINDER';

-- DropIndex
DROP INDEX "companies_domain_key";

-- AlterTable
ALTER TABLE "assessment_periods" ADD COLUMN     "workflow_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "appearance_settings" JSONB,
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "kpi_preferences" JSONB,
ADD COLUMN     "linked_employee_id" TEXT,
ADD COLUMN     "notification_settings" JSONB,
ADD COLUMN     "phone_number" TEXT;

-- CreateTable
CREATE TABLE "login_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "location" TEXT,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_department_history" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "department_name" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,

    CONSTRAINT "employee_department_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_workflows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "stages" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_instances" (
    "id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "current_stage" "ApprovalStage" NOT NULL DEFAULT 'SELF_EVAL',
    "self_eval_data" JSONB,
    "manager_data" JSONB,
    "skip_level_data" JSONB,
    "hr_data" JSONB,
    "final_score" DOUBLE PRECISION,
    "final_grade" "PerformanceGrade",
    "company_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "approval_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_logs" (
    "id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "stage" "ApprovalStage" NOT NULL,
    "action" "ApprovalAction" NOT NULL,
    "operator_id" TEXT NOT NULL,
    "operator_name" TEXT NOT NULL,
    "operator_role" TEXT NOT NULL,
    "comment" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibration_sessions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "department_ids" JSONB NOT NULL,
    "original_stats" JSONB,
    "calibrated_stats" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_by_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "calibration_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibration_adjustments" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "original_score" DOUBLE PRECISION NOT NULL,
    "adjusted_score" DOUBLE PRECISION NOT NULL,
    "original_grade" "PerformanceGrade",
    "adjusted_grade" "PerformanceGrade",
    "reason" TEXT,
    "adjusted_by_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calibration_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_configs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "period_id" TEXT,
    "distribution" JSONB NOT NULL,
    "score_boundaries" JSONB,
    "is_enforced" BOOLEAN NOT NULL DEFAULT false,
    "tolerance" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribution_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_interviews" (
    "id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "interviewer_id" TEXT NOT NULL,
    "interviewer_name" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "conducted_at" TIMESTAMP(3),
    "summary" TEXT,
    "strengths" TEXT,
    "improvements" TEXT,
    "goals" TEXT,
    "employee_feedback" TEXT,
    "attachments" JSONB,
    "employee_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "employee_confirmed_at" TIMESTAMP(3),
    "company_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "potential_assessments" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "learning_agility" INTEGER NOT NULL,
    "leadership_potential" INTEGER NOT NULL,
    "technical_depth" INTEGER NOT NULL,
    "collaboration_skill" INTEGER NOT NULL,
    "potential_score" DOUBLE PRECISION NOT NULL,
    "grid_position" TEXT,
    "assessor_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "potential_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_alignments" (
    "id" TEXT NOT NULL,
    "child_assignment_id" TEXT NOT NULL,
    "parent_assignment_id" TEXT NOT NULL,
    "contribution_weight" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "period_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_alignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_coefficients" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "coefficients" JSONB NOT NULL,
    "bonus_base_type" TEXT NOT NULL DEFAULT 'fixed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_coefficients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_calculations" (
    "id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "performance_score" DOUBLE PRECISION NOT NULL,
    "performance_grade" "PerformanceGrade" NOT NULL,
    "coefficient" DOUBLE PRECISION NOT NULL,
    "base_salary" DOUBLE PRECISION,
    "bonus_amount" DOUBLE PRECISION,
    "exported_at" TIMESTAMP(3),
    "exported_by_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_check_ins" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "check_in_date" TIMESTAMP(3) NOT NULL,
    "current_value" DOUBLE PRECISION NOT NULL,
    "progress_percent" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "attachments" JSONB,
    "risk_level" TEXT NOT NULL DEFAULT 'normal',
    "manager_feedback" TEXT,
    "feedback_by_id" TEXT,
    "feedback_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_source_configs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "connection_config" JSONB NOT NULL,
    "field_mapping" JSONB NOT NULL,
    "sync_frequency" TEXT NOT NULL DEFAULT 'daily',
    "last_sync_at" TIMESTAMP(3),
    "last_sync_status" TEXT,
    "last_sync_error" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_source_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_sync_logs" (
    "id" TEXT NOT NULL,
    "data_source_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "records_processed" INTEGER NOT NULL DEFAULT 0,
    "records_failed" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_history_user_id_idx" ON "login_history"("user_id");

-- CreateIndex
CREATE INDEX "login_history_created_at_idx" ON "login_history"("created_at");

-- CreateIndex
CREATE INDEX "employee_department_history_employee_id_idx" ON "employee_department_history"("employee_id");

-- CreateIndex
CREATE INDEX "employee_department_history_company_id_idx" ON "employee_department_history"("company_id");

-- CreateIndex
CREATE INDEX "employee_department_history_effective_date_idx" ON "employee_department_history"("effective_date");

-- CreateIndex
CREATE INDEX "approval_workflows_company_id_idx" ON "approval_workflows"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "approval_workflows_company_id_name_key" ON "approval_workflows"("company_id", "name");

-- CreateIndex
CREATE INDEX "approval_instances_period_id_idx" ON "approval_instances"("period_id");

-- CreateIndex
CREATE INDEX "approval_instances_employee_id_idx" ON "approval_instances"("employee_id");

-- CreateIndex
CREATE INDEX "approval_instances_current_stage_idx" ON "approval_instances"("current_stage");

-- CreateIndex
CREATE UNIQUE INDEX "approval_instances_period_id_employee_id_key" ON "approval_instances"("period_id", "employee_id");

-- CreateIndex
CREATE INDEX "approval_logs_instance_id_idx" ON "approval_logs"("instance_id");

-- CreateIndex
CREATE INDEX "approval_logs_operator_id_idx" ON "approval_logs"("operator_id");

-- CreateIndex
CREATE INDEX "calibration_sessions_period_id_idx" ON "calibration_sessions"("period_id");

-- CreateIndex
CREATE INDEX "calibration_sessions_company_id_idx" ON "calibration_sessions"("company_id");

-- CreateIndex
CREATE INDEX "calibration_adjustments_session_id_idx" ON "calibration_adjustments"("session_id");

-- CreateIndex
CREATE INDEX "calibration_adjustments_employee_id_idx" ON "calibration_adjustments"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "calibration_adjustments_session_id_employee_id_key" ON "calibration_adjustments"("session_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "distribution_configs_company_id_period_id_key" ON "distribution_configs"("company_id", "period_id");

-- CreateIndex
CREATE INDEX "performance_interviews_period_id_idx" ON "performance_interviews"("period_id");

-- CreateIndex
CREATE INDEX "performance_interviews_interviewer_id_idx" ON "performance_interviews"("interviewer_id");

-- CreateIndex
CREATE UNIQUE INDEX "performance_interviews_period_id_employee_id_key" ON "performance_interviews"("period_id", "employee_id");

-- CreateIndex
CREATE INDEX "potential_assessments_period_id_idx" ON "potential_assessments"("period_id");

-- CreateIndex
CREATE INDEX "potential_assessments_company_id_idx" ON "potential_assessments"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "potential_assessments_employee_id_period_id_key" ON "potential_assessments"("employee_id", "period_id");

-- CreateIndex
CREATE INDEX "goal_alignments_period_id_idx" ON "goal_alignments"("period_id");

-- CreateIndex
CREATE INDEX "goal_alignments_parent_assignment_id_idx" ON "goal_alignments"("parent_assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "goal_alignments_child_assignment_id_parent_assignment_id_key" ON "goal_alignments"("child_assignment_id", "parent_assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "salary_coefficients_company_id_key" ON "salary_coefficients"("company_id");

-- CreateIndex
CREATE INDEX "salary_calculations_period_id_idx" ON "salary_calculations"("period_id");

-- CreateIndex
CREATE INDEX "salary_calculations_company_id_idx" ON "salary_calculations"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "salary_calculations_period_id_employee_id_key" ON "salary_calculations"("period_id", "employee_id");

-- CreateIndex
CREATE INDEX "progress_check_ins_assignment_id_idx" ON "progress_check_ins"("assignment_id");

-- CreateIndex
CREATE INDEX "progress_check_ins_employee_id_idx" ON "progress_check_ins"("employee_id");

-- CreateIndex
CREATE INDEX "progress_check_ins_check_in_date_idx" ON "progress_check_ins"("check_in_date");

-- CreateIndex
CREATE INDEX "progress_check_ins_risk_level_idx" ON "progress_check_ins"("risk_level");

-- CreateIndex
CREATE INDEX "progress_check_ins_company_id_risk_level_idx" ON "progress_check_ins"("company_id", "risk_level");

-- CreateIndex
CREATE INDEX "data_source_configs_company_id_idx" ON "data_source_configs"("company_id");

-- CreateIndex
CREATE INDEX "data_sync_logs_data_source_id_idx" ON "data_sync_logs"("data_source_id");

-- CreateIndex
CREATE INDEX "data_sync_logs_company_id_idx" ON "data_sync_logs"("company_id");

-- CreateIndex
CREATE INDEX "kpi_data_entries_submission_id_employee_id_idx" ON "kpi_data_entries"("submission_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_linked_employee_id_key" ON "users"("linked_employee_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_linked_employee_id_fkey" FOREIGN KEY ("linked_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_department_history" ADD CONSTRAINT "employee_department_history_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_periods" ADD CONSTRAINT "assessment_periods_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "approval_workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_logs" ADD CONSTRAINT "approval_logs_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "approval_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibration_adjustments" ADD CONSTRAINT "calibration_adjustments_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "calibration_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
