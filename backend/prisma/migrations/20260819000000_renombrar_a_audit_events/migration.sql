-- Bitacora: activity_audit_events -> audit_events
--
-- Generalizar la bitacora del modulo de actividades a una bitacora de toda la
-- plataforma (sesiones, actividades y acciones administrativas). La data se
-- conserva: se RENAME la tabla (las 38 filas existentes no se tocan) y se
-- anaden las columnas nuevas. El nombre de la PK y de la FK derivan del nombre
-- de la tabla, asi que Postgres los renombra al renombrar la tabla; los indices
-- de columna tienen nombre explicito y se reemplazan por los compuestos que el
-- schema declara.

BEGIN;

-- 1. Renombrar la tabla. Postgres renombra automaticamente la PK
--    (audit_events_pkey) y la FK user (audit_events_user_id_fkey), que derivan
--    del nombre de la tabla.
ALTER TABLE "activity_audit_events" RENAME TO "audit_events";

-- 2. Los indices de columna tienen nombre explicito (no derivan del nombre de
--    la tabla) y no se renombran solos. Se reemplazan por los compuestos que el
--    schema declara.
DROP INDEX "activity_audit_events_group_id_idx";
DROP INDEX "activity_audit_events_user_id_idx";

CREATE INDEX "audit_events_group_id_created_at_idx" ON "audit_events"("group_id", "created_at");
CREATE INDEX "audit_events_event_type_created_at_idx" ON "audit_events"("event_type", "created_at");
CREATE INDEX "audit_events_user_id_created_at_idx" ON "audit_events"("user_id", "created_at");

-- 3. Columnas nuevas. Se anaden con default temporal y backfill para no romper
--    las filas existentes; el default se quita al final (el schema no lo lleva).
ALTER TABLE "audit_events" ADD COLUMN "actor_role" VARCHAR(16) NOT NULL DEFAULT 'unknown';
ALTER TABLE "audit_events" ADD COLUMN "message" VARCHAR(280) NOT NULL DEFAULT '';
ALTER TABLE "audit_events" ADD COLUMN "ip" VARCHAR(45);
ALTER TABLE "audit_events" ADD COLUMN "user_agent" VARCHAR(255);

-- 3a. Backfill de las 38 filas historicas (todas del modulo de actividades):
--     el rol del actor se resuelve de su rol actual y `message` se redacta
--     desde el tipo de evento y el target. No queda ningun registro vacio.
UPDATE "audit_events" e
SET "actor_role" = COALESCE(u."role"::text, 'unknown'),
    "message" = (u."name" || CASE
      WHEN e."event_type" = 'activity_submitted'  THEN ' entrego la actividad '''
      WHEN e."event_type" = 'activity_checked'    THEN ' valido la actividad '''
      WHEN e."event_type" = 'activity_graded'     THEN ' califico la entrega de la actividad '''
      WHEN e."event_type" = 'activity_created'    THEN ' creo la actividad '''
      WHEN e."event_type" = 'activity_updated'    THEN ' actualizo la actividad '''
      WHEN e."event_type" = 'activity_enabled'    THEN ' habilito la actividad '''
      WHEN e."event_type" = 'activity_disabled'   THEN ' deshabilito la actividad '''
      WHEN e."event_type" = 'activity_due_extended' THEN ' extendio la fecha de la actividad '''
      ELSE (' realizo una accion (' || e."event_type" || ') sobre ')
    END || e."target" || '''.')
FROM "User" u
WHERE u."id" = e."user_id";

-- 3b. Quitar los defaults temporales para que la tabla coincida con el schema.
ALTER TABLE "audit_events" ALTER COLUMN "actor_role" DROP DEFAULT;
ALTER TABLE "audit_events" ALTER COLUMN "message" DROP DEFAULT;

COMMIT;
