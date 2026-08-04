-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(64),
    "title" VARCHAR(255) NOT NULL,
    "instructions" TEXT,
    "topic_number" INTEGER,
    "group_id" UUID,
    "max_score" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_checks" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "type" VARCHAR(48) NOT NULL,
    "params" JSONB NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "activity_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_attempts" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "results" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activities_slug_key" ON "activities"("slug");
CREATE INDEX "activity_checks_activity_id_idx" ON "activity_checks"("activity_id");
CREATE INDEX "activity_attempts_activity_id_student_id_idx" ON "activity_attempts"("activity_id", "student_id");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "activity_checks" ADD CONSTRAINT "activity_checks_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_attempts" ADD CONSTRAINT "activity_attempts_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_attempts" ADD CONSTRAINT "activity_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
