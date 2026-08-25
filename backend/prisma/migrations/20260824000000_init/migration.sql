-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'teacher', 'student');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "EvaluationType" AS ENUM ('automatic', 'manual');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('workshop', 'quiz');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('submitted', 'graded', 'returned');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('basic', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "TopicActivityKind" AS ENUM ('check', 'activity');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('user_provisioning', 'group_provisioning', 'group_teardown');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('system', 'light', 'dark');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('auth_login', 'auth_logout', 'activity_submitted', 'activity_checked', 'activity_graded', 'activity_created', 'activity_updated', 'activity_enabled', 'activity_disabled', 'activity_due_extended', 'teacher_registered', 'teacher_toggled', 'group_created', 'group_archived', 'group_deleted', 'student_registered', 'csv_imported');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "google_id" VARCHAR(255),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "user_id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "user_id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "user_id" UUID NOT NULL,
    "terminal_font_size" INTEGER NOT NULL DEFAULT 16,
    "terminal_font_family" VARCHAR(96) NOT NULL DEFAULT 'Menlo, Monaco, ''Courier New'', monospace',
    "theme" "Theme" NOT NULL DEFAULT 'system',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "LinuxAccount" (
    "user_id" UUID NOT NULL,
    "linux_username" VARCHAR(32) NOT NULL,
    "linux_provisioned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinuxAccount_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" UUID NOT NULL,
    "group_number" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "teacher_id" UUID NOT NULL,
    "status" "GroupStatus" NOT NULL DEFAULT 'active',
    "group_dir" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" UUID NOT NULL,
    "order_number" INTEGER NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subtopic" (
    "id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "order_number" INTEGER NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "file" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subtopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicActivity" (
    "id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "subtopic_id" UUID,
    "kind" "TopicActivityKind" NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "instructions" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'basic',
    "setup" JSONB,
    "checks" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicProgress" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicSubmission" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "topic_activity_id" UUID NOT NULL,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "score" INTEGER NOT NULL DEFAULT 0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "auto_results" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonView" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "subtopic_id" UUID NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupActivity" (
    "id" UUID NOT NULL,
    "activity_number" SERIAL NOT NULL,
    "group_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "instructions" TEXT,
    "activity_type" "ActivityType" NOT NULL DEFAULT 'workshop',
    "evaluation_type" "EvaluationType" NOT NULL DEFAULT 'automatic',
    "max_score" INTEGER NOT NULL DEFAULT 100,
    "setup" JSONB,
    "checks" JSONB NOT NULL,
    "attempt_limit" INTEGER,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "due_at" TIMESTAMP(3),
    "workdir" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupSubmission" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "group_activity_id" UUID NOT NULL,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'submitted',
    "score" INTEGER,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionAutoDetail" (
    "submission_id" UUID NOT NULL,
    "auto_results" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionAutoDetail_pkey" PRIMARY KEY ("submission_id")
);

-- CreateTable
CREATE TABLE "SubmissionManualDetail" (
    "submission_id" UUID NOT NULL,
    "evidence" JSONB NOT NULL,
    "feedback" TEXT,
    "graded_by" UUID,
    "graded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionManualDetail_pkey" PRIMARY KEY ("submission_id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" UUID NOT NULL,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "user_id" UUID,
    "group_id" UUID,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "user_role" "Role" NOT NULL,
    "group_id" UUID,
    "event_type" "EventType" NOT NULL,
    "message" VARCHAR(280) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_google_id_key" ON "User"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "Student_code_key" ON "Student"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_code_key" ON "Teacher"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LinuxAccount_linux_username_key" ON "LinuxAccount"("linux_username");

-- CreateIndex
CREATE UNIQUE INDEX "Group_group_number_key" ON "Group"("group_number");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_student_id_group_id_key" ON "Enrollment"("student_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_order_number_key" ON "Topic"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "Subtopic_topic_id_idx" ON "Subtopic"("topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "Subtopic_topic_id_slug_key" ON "Subtopic"("topic_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "TopicActivity_subtopic_id_key" ON "TopicActivity"("subtopic_id");

-- CreateIndex
CREATE UNIQUE INDEX "TopicActivity_slug_key" ON "TopicActivity"("slug");

-- CreateIndex
CREATE INDEX "TopicActivity_topic_id_idx" ON "TopicActivity"("topic_id");

-- CreateIndex
CREATE INDEX "TopicActivity_subtopic_id_idx" ON "TopicActivity"("subtopic_id");

-- CreateIndex
CREATE UNIQUE INDEX "TopicProgress_enrollment_id_topic_id_key" ON "TopicProgress"("enrollment_id", "topic_id");

-- CreateIndex
CREATE INDEX "TopicSubmission_enrollment_id_topic_activity_id_idx" ON "TopicSubmission"("enrollment_id", "topic_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "LessonView_enrollment_id_subtopic_id_key" ON "LessonView"("enrollment_id", "subtopic_id");

-- CreateIndex
CREATE UNIQUE INDEX "GroupActivity_activity_number_key" ON "GroupActivity"("activity_number");

-- CreateIndex
CREATE INDEX "GroupActivity_group_id_idx" ON "GroupActivity"("group_id");

-- CreateIndex
CREATE INDEX "GroupSubmission_enrollment_id_group_activity_id_idx" ON "GroupSubmission"("enrollment_id", "group_activity_id");

-- CreateIndex
CREATE INDEX "Job_status_retries_idx" ON "Job"("status", "retries");

-- CreateIndex
CREATE INDEX "Job_group_id_idx" ON "Job"("group_id");

-- CreateIndex
CREATE INDEX "Job_user_id_idx" ON "Job"("user_id");

-- CreateIndex
CREATE INDEX "AuditEvent_group_id_created_at_idx" ON "AuditEvent"("group_id", "created_at");

-- CreateIndex
CREATE INDEX "AuditEvent_event_type_created_at_idx" ON "AuditEvent"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "AuditEvent_user_id_created_at_idx" ON "AuditEvent"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinuxAccount" ADD CONSTRAINT "LinuxAccount_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "Teacher"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtopic" ADD CONSTRAINT "Subtopic_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicActivity" ADD CONSTRAINT "TopicActivity_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicActivity" ADD CONSTRAINT "TopicActivity_subtopic_id_fkey" FOREIGN KEY ("subtopic_id") REFERENCES "Subtopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicProgress" ADD CONSTRAINT "TopicProgress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicProgress" ADD CONSTRAINT "TopicProgress_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicSubmission" ADD CONSTRAINT "TopicSubmission_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicSubmission" ADD CONSTRAINT "TopicSubmission_topic_activity_id_fkey" FOREIGN KEY ("topic_activity_id") REFERENCES "TopicActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonView" ADD CONSTRAINT "LessonView_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonView" ADD CONSTRAINT "LessonView_subtopic_id_fkey" FOREIGN KEY ("subtopic_id") REFERENCES "Subtopic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupActivity" ADD CONSTRAINT "GroupActivity_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSubmission" ADD CONSTRAINT "GroupSubmission_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSubmission" ADD CONSTRAINT "GroupSubmission_group_activity_id_fkey" FOREIGN KEY ("group_activity_id") REFERENCES "GroupActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionAutoDetail" ADD CONSTRAINT "SubmissionAutoDetail_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "GroupSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionManualDetail" ADD CONSTRAINT "SubmissionManualDetail_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "GroupSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionManualDetail" ADD CONSTRAINT "SubmissionManualDetail_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "Teacher"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

