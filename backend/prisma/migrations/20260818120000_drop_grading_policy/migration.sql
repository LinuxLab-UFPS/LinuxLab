-- Elimina la politica de calificacion `best_score`: la nota final de una
-- actividad siempre es la del ultimo intento valido. El historial de intentos
-- queda intacto para poder verificar notas anteriores.

BEGIN;

ALTER TABLE "group_activities" DROP COLUMN "grading_policy";

COMMIT;
