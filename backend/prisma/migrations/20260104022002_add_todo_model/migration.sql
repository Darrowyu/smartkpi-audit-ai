-- CreateEnum
CREATE TYPE "TodoPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "todos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3),
    "priority" "TodoPriority" NOT NULL DEFAULT 'MEDIUM',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "related_type" TEXT,
    "related_id" TEXT,
    "reminder_days" INTEGER,
    "recurrence" TEXT,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "todos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "todos_user_id_idx" ON "todos"("user_id");

-- CreateIndex
CREATE INDEX "todos_company_id_idx" ON "todos"("company_id");

-- CreateIndex
CREATE INDEX "todos_due_date_idx" ON "todos"("due_date");

-- CreateIndex
CREATE INDEX "todos_completed_idx" ON "todos"("completed");

-- AddForeignKey
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
