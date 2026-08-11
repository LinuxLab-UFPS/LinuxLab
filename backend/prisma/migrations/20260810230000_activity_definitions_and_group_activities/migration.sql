-- Migracion: activities -> activity_definitions + group_activities (publicaciones)
--
-- La data se conserva: RENAME + columnas nuevas + backfill controlado. Los IDs
-- de definiciones, aserciones e intentos no cambian. Los intentos de las
-- actividades (kind=activity) se re-apuntan a la publicacion de su grupo y se
-- numeran; las comprobaciones del temario (kind=check) quedan sin publicacion
-- (group_activity_id NULL), como debe ser mientras el mecanismo por slug siga.

BEGIN;

-- 1. activities -> activity_definitions
ALTER TABLE "activities" RENAME TO "activity_definitions";

-- La relacion con el grupo pasa a la publicacion (GroupActivity). El campo
-- estaba vacio en toda la data actual (verificado antes de migrar).
ALTER TABLE "activity_definitions" DROP CONSTRAINT "activities_group_id_fkey";
ALTER TABLE "activity_definitions" DROP COLUMN "group_id";

ALTER TABLE "activity_definitions" ADD COLUMN "activity_type" VARCHAR(16) NOT NULL DEFAULT 'workshop';
ALTER TABLE "activity_definitions" ADD COLUMN "evaluation_type" VARCHAR(16) NOT NULL DEFAULT 'automatic';
ALTER TABLE "activity_definitions" ADD COLUMN "source" VARCHAR(16) NOT NULL DEFAULT 'bank';
ALTER TABLE "activity_definitions" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "activity_definitions" ADD COLUMN "created_by" UUID;

ALTER TABLE "activity_definitions" RENAME CONSTRAINT "activities_pkey" TO "activity_definitions_pkey";
ALTER INDEX "activities_kind_idx" RENAME TO "activity_definitions_kind_idx";
-- slug es un UNIQUE INDEX (Prisma lo crea como indice, no como constraint)
ALTER INDEX "activities_slug_key" RENAME TO "activity_definitions_slug_key";

-- 2. activity_checks -> apunta a la definicion
ALTER TABLE "activity_checks" DROP CONSTRAINT "activity_checks_activity_id_fkey";
ALTER TABLE "activity_checks" RENAME COLUMN "activity_id" TO "activity_definition_id";
ALTER INDEX "activity_checks_activity_id_idx" RENAME TO "activity_checks_activity_definition_id_idx";
ALTER TABLE "activity_checks" ADD CONSTRAINT "activity_checks_activity_definition_id_fkey"
  FOREIGN KEY ("activity_definition_id") REFERENCES "activity_definitions"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

-- 3. activity_attempts -> columnas nuevas (la FK se re-agrega al final, con RESTRICT)
ALTER TABLE "activity_attempts" DROP CONSTRAINT "activity_attempts_activity_id_fkey";
ALTER TABLE "activity_attempts" RENAME COLUMN "activity_id" TO "activity_definition_id";
ALTER INDEX "activity_attempts_activity_id_student_id_idx"
  RENAME TO "activity_attempts_activity_definition_id_student_id_idx";
ALTER TABLE "activity_attempts" ADD COLUMN "group_activity_id" UUID;
ALTER TABLE "activity_attempts" ADD COLUMN "attempt_number" INTEGER NOT NULL DEFAULT 1;

-- 4. group_activities: la publicacion. Guarda su propia copia de la config
--    (title, instructions, activity_type, evaluation_type, max_score, checks):
--    lo que cambie en la definicion no altera lo publicado (RF-GRP-11).
CREATE TABLE "group_activities" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "activity_definition_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "instructions" TEXT,
    "activity_type" VARCHAR(16) NOT NULL,
    "evaluation_type" VARCHAR(16) NOT NULL,
    "max_score" INTEGER NOT NULL DEFAULT 100,
    "checks" JSONB NOT NULL,
    "attempt_limit" INTEGER,
    "grading_policy" VARCHAR(16) NOT NULL DEFAULT 'best_score',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "due_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "group_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "group_activities_group_id_idx" ON "group_activities"("group_id");
CREATE INDEX "group_activities_activity_definition_id_idx"
  ON "group_activities"("activity_definition_id");

ALTER TABLE "group_activities" ADD CONSTRAINT "group_activities_group_id_fkey"
  FOREIGN KEY ("group_id") REFERENCES "groups"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;
-- SET NULL: la publicacion es autonoma (lleva su snapshot), sobrevive aunque
-- la definicion se elimine del banco.
ALTER TABLE "group_activities" ADD CONSTRAINT "group_activities_activity_definition_id_fkey"
  FOREIGN KEY ("activity_definition_id") REFERENCES "activity_definitions"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

-- 5. Backfill: por cada (estudiante, definicion kind=activity con intentos) se
--    publica en el grupo de su matricula mas antigua (la atribucion es
--    inequivoca con la data actual: un solo grupo por estudiante). La publicacion
--    hereda el snapshot de titulo, instrucciones, tipo, modalidad, puntaje y
--    aserciones de la definicion.
WITH estudiante_grupo AS (
  SELECT DISTINCT ON (a."student_id", d."id")
         a."student_id", d."id" AS definition_id, e."group_id"
  FROM "activity_attempts" a
  JOIN "activity_definitions" d ON d."id" = a."activity_definition_id"
  JOIN "enrollments" e ON e."student_id" = a."student_id"
  WHERE d."kind" = 'activity'
  ORDER BY a."student_id", d."id", e."enrolled_at", e."id"
)
INSERT INTO "group_activities"
  ("id", "group_id", "activity_definition_id", "title", "instructions",
   "activity_type", "evaluation_type", "max_score", "checks", "attempt_limit",
   "grading_policy", "required", "enabled", "due_at", "published_at",
   "created_at", "updated_at")
SELECT gen_random_uuid(),
       eg."group_id",
       d."id",
       d."title",
       d."instructions",
       d."activity_type",
       d."evaluation_type",
       d."max_score",
       COALESCE((
         SELECT jsonb_agg(
                  jsonb_build_object('id', c."id", 'type', c."type",
                                     'params', c."params", 'points', c."points",
                                     'position', c."position")
                  ORDER BY c."position")
         FROM "activity_checks" c
         WHERE c."activity_definition_id" = d."id"
       ), '[]'::jsonb),
       NULL,
       'best_score',
       true,
       true,
       NULL,
       NULL,
       now(),
       now()
FROM estudiante_grupo eg
JOIN "activity_definitions" d ON d."id" = eg."definition_id"
GROUP BY eg."group_id", d."id";

-- 6. Los intentos de actividades quedan ligados a su publicacion. Las
--    comprobaciones del temario (sin publicacion) conservan NULL.
UPDATE "activity_attempts" a
SET "group_activity_id" = ga."id"
FROM "group_activities" ga
JOIN "enrollments" e ON e."group_id" = ga."group_id"
WHERE ga."activity_definition_id" = a."activity_definition_id"
  AND e."student_id" = a."student_id";

-- 7. Numerar los intentos por (definicion, estudiante) en su orden real.
WITH numerados AS (
  SELECT a."id", row_number() OVER (
           PARTITION BY a."activity_definition_id", a."student_id"
           ORDER BY a."created_at", a."id"
         ) AS n
  FROM "activity_attempts" a
)
UPDATE "activity_attempts" a
SET "attempt_number" = numerados.n
FROM numerados
WHERE a."id" = numerados."id";

-- 8. FKs de intentos: RESTRICT en los dos lados. El historial no se borra por
--    cascade; el unico camino de borrado es manual y con confirmacion.
ALTER TABLE "activity_attempts" ADD CONSTRAINT "activity_attempts_activity_definition_id_fkey"
  FOREIGN KEY ("activity_definition_id") REFERENCES "activity_definitions"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "activity_attempts" ADD CONSTRAINT "activity_attempts_group_activity_id_fkey"
  FOREIGN KEY ("group_activity_id") REFERENCES "group_activities"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE INDEX "activity_attempts_group_activity_id_idx" ON "activity_attempts"("group_activity_id");

-- 9. activity_submissions: entregas de evaluacion manual
CREATE TABLE "activity_submissions" (
    "id" UUID NOT NULL,
    "group_activity_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(16) NOT NULL DEFAULT 'submitted',
    "evidence" JSONB NOT NULL,
    "score" INTEGER,
    "feedback" TEXT,
    "graded_by" UUID,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "graded_at" TIMESTAMP(3),
    CONSTRAINT "activity_submissions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "activity_submissions_group_activity_id_student_id_idx"
  ON "activity_submissions"("group_activity_id", "student_id");

ALTER TABLE "activity_submissions" ADD CONSTRAINT "activity_submissions_group_activity_id_fkey"
  FOREIGN KEY ("group_activity_id") REFERENCES "group_activities"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "activity_submissions" ADD CONSTRAINT "activity_submissions_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "User"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "activity_submissions" ADD CONSTRAINT "activity_submissions_graded_by_fkey"
  FOREIGN KEY ("graded_by") REFERENCES "User"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

-- 10. activity_audit_events: bitacora del modulo. group_id nullable a proposito:
--     si el grupo se borra (con confirmacion), el evento conserva su snapshot.
CREATE TABLE "activity_audit_events" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "group_id" UUID,
    "event_type" VARCHAR(48) NOT NULL,
    "target" VARCHAR(255),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "activity_audit_events_group_id_idx" ON "activity_audit_events"("group_id");
CREATE INDEX "activity_audit_events_user_id_idx" ON "activity_audit_events"("user_id");

ALTER TABLE "activity_audit_events" ADD CONSTRAINT "activity_audit_events_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- 11. FK de la definicion hacia su creador (opcional, para actividades de docente)
ALTER TABLE "activity_definitions" ADD CONSTRAINT "activity_definitions_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "User"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

COMMIT;
