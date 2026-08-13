-- Prioridad en los jobs de aprovisionamiento: el worker procesa por orden
-- jerarquico (docentes antes que grupos antes que estudiantes) sin depender
-- del orden procedural de las llamadas.

BEGIN;

ALTER TABLE "user_provisioning_jobs" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "group_provisioning_jobs" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;

-- Docentes (sin grupo) tienen la maxima prioridad; estudiantes la minima.
UPDATE "user_provisioning_jobs" SET "priority" = 10 WHERE "group_id" IS NULL;
UPDATE "user_provisioning_jobs" SET "priority" = 1 WHERE "group_id" IS NOT NULL;
UPDATE "group_provisioning_jobs" SET "priority" = 5;

COMMIT;
