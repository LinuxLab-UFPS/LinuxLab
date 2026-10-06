-- AlterTable
ALTER TABLE "Group" ADD COLUMN "auto_finish_at" TIMESTAMP(3),
ADD COLUMN "min_progress" INTEGER NOT NULL DEFAULT 100;
