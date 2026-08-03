-- Move the only student-specific field onto the authoritative User record.
ALTER TABLE "User" ADD COLUMN "code" VARCHAR(20);

UPDATE "User" AS u
SET "code" = s."code"
FROM "students" AS s
WHERE s."user_id" = u."id";

-- Groups and enrollments now reference User directly. The application validates
-- that group teachers have role = 'teacher' and enrolled users have role = 'student'.
ALTER TABLE "groups" DROP CONSTRAINT "groups_teacher_id_fkey";
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_student_id_fkey";

ALTER TABLE "groups"
  ADD CONSTRAINT "groups_teacher_id_fkey"
  FOREIGN KEY ("teacher_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "enrollments"
  ADD CONSTRAINT "enrollments_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP TABLE "teachers";
DROP TABLE "students";
