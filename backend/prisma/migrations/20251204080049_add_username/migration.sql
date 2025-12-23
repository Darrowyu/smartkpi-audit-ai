/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX IF EXISTS "users_email_idx";

-- DropIndex
DROP INDEX IF EXISTS "users_email_key";

-- AlterTable: 先添加可空列
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- 用email前缀填充现有用户的username
UPDATE "users" SET "username" = SPLIT_PART("email", '@', 1) WHERE "username" IS NULL;

-- 设置为非空
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

-- 邮箱改为可选
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");
