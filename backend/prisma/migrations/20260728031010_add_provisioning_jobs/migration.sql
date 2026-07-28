-- CreateTable
CREATE TABLE "provisioning_jobs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "username" VARCHAR(32) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "retries" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provisioning_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "provisioning_jobs_status_retries_idx" ON "provisioning_jobs"("status", "retries");

-- AddForeignKey
ALTER TABLE "provisioning_jobs" ADD CONSTRAINT "provisioning_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
