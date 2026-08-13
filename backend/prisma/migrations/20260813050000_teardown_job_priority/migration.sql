-- claimJobs ordena por priority en todas las tablas de jobs. group_teardown_jobs
-- tambien la lleva (0: orden cronologico puro, sin jerarquia).

BEGIN;

ALTER TABLE "group_teardown_jobs" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;

COMMIT;
