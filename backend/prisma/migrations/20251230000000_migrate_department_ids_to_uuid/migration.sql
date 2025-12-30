-- Migrate legacy seeded Department IDs (non-UUID) to UUIDs so API UUID validation works.

DO $$
DECLARE
  sales_old_id TEXT := 'sales-dept-id';
  tech_old_id  TEXT := 'tech-dept-id';
  sales_new_id TEXT := '9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
  tech_new_id  TEXT := '1a2b3c4d-5e6f-4a7b-9c8d-0e1f2a3b4c5d';
BEGIN
  -- If both old and new exist, we can't UPDATE PK to the new value (PK conflict); move references and deactivate old.
  IF EXISTS (SELECT 1 FROM "departments" WHERE "id" = sales_old_id) THEN
    IF EXISTS (SELECT 1 FROM "departments" WHERE "id" = sales_new_id) THEN
      UPDATE "users" SET "department_id" = sales_new_id WHERE "department_id" = sales_old_id;
      UPDATE "employees" SET "department_id" = sales_new_id WHERE "department_id" = sales_old_id;
      IF to_regclass('public.employee_department_history') IS NOT NULL THEN
        UPDATE "employee_department_history" SET "department_id" = sales_new_id WHERE "department_id" = sales_old_id;
      END IF;
      UPDATE "departments" SET "isActive" = false WHERE "id" = sales_old_id;
    ELSE
      UPDATE "departments" SET "id" = sales_new_id WHERE "id" = sales_old_id;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM "departments" WHERE "id" = tech_old_id) THEN
    IF EXISTS (SELECT 1 FROM "departments" WHERE "id" = tech_new_id) THEN
      UPDATE "users" SET "department_id" = tech_new_id WHERE "department_id" = tech_old_id;
      UPDATE "employees" SET "department_id" = tech_new_id WHERE "department_id" = tech_old_id;
      IF to_regclass('public.employee_department_history') IS NOT NULL THEN
        UPDATE "employee_department_history" SET "department_id" = tech_new_id WHERE "department_id" = tech_old_id;
      END IF;
      UPDATE "departments" SET "isActive" = false WHERE "id" = tech_old_id;
    ELSE
      UPDATE "departments" SET "id" = tech_new_id WHERE "id" = tech_old_id;
    END IF;
  END IF;

  -- Update non-FK / denormalized department references.
  IF to_regclass('public.kpi_assignments') IS NOT NULL THEN
    UPDATE "kpi_assignments" SET "department_id" = sales_new_id WHERE "department_id" = sales_old_id;
    UPDATE "kpi_assignments" SET "department_id" = tech_new_id WHERE "department_id" = tech_old_id;
  END IF;

  IF to_regclass('public.data_submissions') IS NOT NULL THEN
    UPDATE "data_submissions" SET "department_id" = sales_new_id WHERE "department_id" = sales_old_id;
    UPDATE "data_submissions" SET "department_id" = tech_new_id WHERE "department_id" = tech_old_id;
  END IF;

  IF to_regclass('public.employee_performances') IS NOT NULL THEN
    UPDATE "employee_performances" SET "department_id" = sales_new_id WHERE "department_id" = sales_old_id;
    UPDATE "employee_performances" SET "locked_dept_id" = sales_new_id WHERE "locked_dept_id" = sales_old_id;
    UPDATE "employee_performances" SET "department_id" = tech_new_id WHERE "department_id" = tech_old_id;
    UPDATE "employee_performances" SET "locked_dept_id" = tech_new_id WHERE "locked_dept_id" = tech_old_id;
  END IF;

  IF to_regclass('public.department_performances') IS NOT NULL THEN
    UPDATE "department_performances" SET "department_id" = sales_new_id WHERE "department_id" = sales_old_id;
    UPDATE "department_performances" SET "department_id" = tech_new_id WHERE "department_id" = tech_old_id;
  END IF;
END $$;
