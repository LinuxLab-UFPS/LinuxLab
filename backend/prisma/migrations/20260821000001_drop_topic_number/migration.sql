-- Fase 2a (parte 2): tras el backfill de topic_id en la migracion
-- 20260821000000_temario_y_progreso, se suelta la columna legacy `topic_number`
-- que ya no usa el modelo.
ALTER TABLE "activity_definitions" DROP COLUMN "topic_number";
