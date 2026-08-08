-- El arbol de trabajo de una actividad, para las que necesitan archivos
-- preparados. Va como JSON porque es una descripcion, no un script.
ALTER TABLE "activities" ADD COLUMN "setup" JSONB;
