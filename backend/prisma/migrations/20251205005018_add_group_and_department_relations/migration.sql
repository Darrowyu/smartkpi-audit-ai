/*
  Warnings:

  - Added the required column `group_id` to the `companies` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'GROUP_ADMIN';

-- CreateTable (先创建 groups 表)
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- 插入默认集团 (Makrite)
INSERT INTO "groups" ("id", "name", "settings", "createdAt", "updatedAt", "isActive")
VALUES ('makrite-group-id', 'Makrite', '{"defaultLanguage": "zh"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true);

-- AlterTable (添加 group_id 列，先不设置 NOT NULL)
ALTER TABLE "companies" ADD COLUMN "group_id" TEXT;

-- 将所有现有公司关联到默认集团
UPDATE "companies" SET "group_id" = 'makrite-group-id' WHERE "group_id" IS NULL;

-- 现在设置 NOT NULL 约束
ALTER TABLE "companies" ALTER COLUMN "group_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "department_id" TEXT;

-- CreateIndex
CREATE INDEX "companies_group_id_idx" ON "companies"("group_id");

-- CreateIndex
CREATE INDEX "users_department_id_idx" ON "users"("department_id");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
