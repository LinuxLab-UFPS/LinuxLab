-- AlterEnum
ALTER TYPE "EventType" ADD VALUE 'teacher_request_approved';
ALTER TYPE "EventType" ADD VALUE 'teacher_request_rejected';

-- CreateEnum
CREATE TYPE "TeacherRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "TeacherRequest" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "status" "TeacherRequestStatus" NOT NULL DEFAULT 'pending',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherRequest_status_created_at_idx" ON "TeacherRequest"("status", "created_at");

-- CreateIndex
CREATE INDEX "TeacherRequest_email_idx" ON "TeacherRequest"("email");
