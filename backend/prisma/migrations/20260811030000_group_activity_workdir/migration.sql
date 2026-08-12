-- La carpeta de trabajo de una actividad es autogenerada y obligatoria.
-- Las 3 publicaciones existentes (actividades del temario backfilled) reciben
-- el slug de su definicion, que es exactamente donde su material vive hoy en
-- el entorno (`~/actividades/<slug>/`). Las futuras actividades de docente la
-- generan el backend.

BEGIN;

ALTER TABLE "group_activities" ADD COLUMN "workdir" VARCHAR(64);

UPDATE "group_activities" ga
SET "workdir" = COALESCE(d."slug", 'act-' || left(replace(ga."id"::text, '-', ''), 8))
FROM "activity_definitions" d
WHERE ga."activity_definition_id" = d."id";

ALTER TABLE "group_activities" ALTER COLUMN "workdir" SET NOT NULL;

COMMIT;
