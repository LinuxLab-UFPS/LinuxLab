-- La dificultad vivia solo en el registro del frontend; el banco la necesita
-- desde la base para poder filtrar y para que el docente la escoja al crear.
ALTER TABLE "activities" ADD COLUMN "difficulty" VARCHAR(16) NOT NULL DEFAULT 'basic';
