-- Separa la comprobacion de una leccion de la actividad que se resuelve junto a
-- la terminal. Solo la segunda entra al banco del docente.
ALTER TABLE "activities" ADD COLUMN "kind" VARCHAR(16) NOT NULL DEFAULT 'activity';
CREATE INDEX "activities_kind_idx" ON "activities"("kind");
