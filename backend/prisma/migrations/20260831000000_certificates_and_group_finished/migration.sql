-- AlterEnum
ALTER TYPE "EventType" ADD VALUE 'group_finished';

-- AlterEnum
ALTER TYPE "GroupStatus" ADD VALUE 'finished';

-- AlterEnum
ALTER TYPE "JobType" ADD VALUE 'certificate_email';

-- CreateTable
CREATE TABLE "Certificate" (
    "id" UUID NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "holder_name" VARCHAR(255) NOT NULL,
    "holder_code" VARCHAR(20),
    "group_name" VARCHAR(255) NOT NULL,
    "group_number" INTEGER NOT NULL,
    "teacher_name" VARCHAR(255) NOT NULL,
    "course_started_at" TIMESTAMP(3) NOT NULL,
    "topics_completed" INTEGER NOT NULL,
    "topics_total" INTEGER NOT NULL,
    "definitive" DOUBLE PRECISION NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructorCertificate" (
    "id" UUID NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "group_id" UUID NOT NULL,
    "holder_name" VARCHAR(255) NOT NULL,
    "group_name" VARCHAR(255) NOT NULL,
    "group_number" INTEGER NOT NULL,
    "course_started_at" TIMESTAMP(3) NOT NULL,
    "students_certified" INTEGER NOT NULL,
    "students_total" INTEGER NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstructorCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_code_key" ON "Certificate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_enrollment_id_key" ON "Certificate"("enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "InstructorCertificate_code_key" ON "InstructorCertificate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "InstructorCertificate_group_id_key" ON "InstructorCertificate"("group_id");

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorCertificate" ADD CONSTRAINT "InstructorCertificate_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
