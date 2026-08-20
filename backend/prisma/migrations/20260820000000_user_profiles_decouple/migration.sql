-- Desacoplar User en perfiles 1:1 (StudentProfile / TeacherProfile).
--
-- * `code` sale de `User` y pasa a `StudentProfile` (solo estudiantes).
-- * Las relaciones "solo estudiante" (matriculas, intentos, entregas) pasan a
--   apuntar a `student_profiles.user_id`; las "solo docente" (grupos, graders)
--   a `teacher_profiles.user_id`. Asi la consistencia rol-relacion se fuerza a
--   nivel de base de datos, no solo en aplicacion.
-- * Indice parcial unico: un estudiante solo puede tener UNA matricula activa
--   (regla "un semestre, una asignatura, un grupo").
--
-- Orden: se crean los perfiles, se backfillan con los usuarios existentes, se
-- retargetan las FKs y por ultimo se suelta la columna `code` de `User`.

-- 1) Crear perfiles (aun sin las FKs de retarget).
CREATE TABLE "student_profiles" (
    "user_id" UUID NOT NULL,
    "code" VARCHAR(20),

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "teacher_profiles" (
    "user_id" UUID NOT NULL,

    CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("user_id")
);

CREATE UNIQUE INDEX "student_profiles_code_key" ON "student_profiles"("code");

ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2) Backfill: una fila de perfil por cada usuario existente de ese rol,
--    copiando el `code` que hasta hoy vivia en `User` (solo para estudiantes).
INSERT INTO "student_profiles" ("user_id", "code")
SELECT "id", "code" FROM "User" WHERE "role" = 'student';

INSERT INTO "teacher_profiles" ("user_id")
SELECT "id" FROM "User" WHERE "role" = 'teacher';

-- 3) Soltar las FKs viejas que colgaban de `User`.
ALTER TABLE "groups" DROP CONSTRAINT "groups_teacher_id_fkey";
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_student_id_fkey";
ALTER TABLE "activity_attempts" DROP CONSTRAINT "activity_attempts_student_id_fkey";
ALTER TABLE "activity_submissions" DROP CONSTRAINT "activity_submissions_student_id_fkey";
ALTER TABLE "activity_submissions" DROP CONSTRAINT "activity_submissions_graded_by_fkey";

-- 4) Retarget: apuntar a los perfiles. Los valores de columna no cambian
--    (siguen siendo el user_id), solo cambia la tabla/columna referenciada.
ALTER TABLE "groups" ADD CONSTRAINT "groups_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "activity_attempts" ADD CONSTRAINT "activity_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "activity_submissions" ADD CONSTRAINT "activity_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "activity_submissions" ADD CONSTRAINT "activity_submissions_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "teacher_profiles"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5) Regla de negocio: un estudiante solo puede tener una matricula activa a
--    la vez (indice parcial unico sobre status='active').
CREATE UNIQUE INDEX "enrollments_one_active_group" ON "enrollments"("student_id") WHERE "status" = 'active';

-- 6) Suelta la columna `code` que vivia en `User` (ya migrada a student_profiles).
ALTER TABLE "User" DROP COLUMN "code";
