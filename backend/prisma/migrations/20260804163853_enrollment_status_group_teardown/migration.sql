-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- Backfill: las matriculas de grupos ya archivados pasan a 'archived'.
UPDATE "enrollments" SET "status" = 'archived'
WHERE "group_id" IN (SELECT "id" FROM "groups" WHERE "archived" = true);

-- CreateTable
CREATE TABLE "group_teardown_jobs" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "group_dir" VARCHAR(64) NOT NULL,
    "group_name" VARCHAR(32) NOT NULL,
    "teacher_username" VARCHAR(32) NOT NULL,
    "usernames" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "retries" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_teardown_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_teardown_jobs_status_retries_idx" ON "group_teardown_jobs"("status", "retries");

-- AddForeignKey
ALTER TABLE "group_teardown_jobs" ADD CONSTRAINT "group_teardown_jobs_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
