-- AlterTable: dificultad de las actividades creadas por el docente, con el
-- mismo enum del temario. Las filas existentes quedan en 'basic'.
ALTER TABLE "GroupActivity" ADD COLUMN     "difficulty" "Difficulty" NOT NULL DEFAULT 'basic';
