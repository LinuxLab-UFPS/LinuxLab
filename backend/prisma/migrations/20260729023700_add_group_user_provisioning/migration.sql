-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "group_dir" VARCHAR(64);

-- CreateTable
CREATE TABLE "user_provisioning_jobs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "username" VARCHAR(64) NOT NULL,
    "group_id" UUID,
    "group_name" VARCHAR(32),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "retries" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_provisioning_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_provisioning_jobs" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "group_dir" VARCHAR(64) NOT NULL,
    "group_name" VARCHAR(32) NOT NULL,
    "teacher_username" VARCHAR(32) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "retries" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_provisioning_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_provisioning_jobs_status_retries_idx" ON "user_provisioning_jobs"("status", "retries");

-- CreateIndex
CREATE INDEX "group_provisioning_jobs_status_retries_idx" ON "group_provisioning_jobs"("status", "retries");

-- AddForeignKey
ALTER TABLE "user_provisioning_jobs" ADD CONSTRAINT "user_provisioning_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_provisioning_jobs" ADD CONSTRAINT "user_provisioning_jobs_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_provisioning_jobs" ADD CONSTRAINT "group_provisioning_jobs_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
