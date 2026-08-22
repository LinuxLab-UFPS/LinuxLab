-- Limpieza del modelo de actividades y temario.
--
-- 1) activity_definitions: se elimina `subtopic_id` y su FK. Las actividades
--    (banco y docente) se ligan al tema por `topic_id`; el banco ya no se
--    relaciona a un subtema (la asociacion subtema->actividad vive en meta.json
--    del frontend, no en la base).
-- 2) activity_definitions: se elimina `kind` ("check"/"activity"), que nadie
--    leia para filtrar ni mostrar.
-- 3) topics: se elimina `complementary`, campo sin consumidor.

-- 1) subtopic_id
ALTER TABLE "activity_definitions" DROP COLUMN "subtopic_id";

-- 2) kind
ALTER TABLE "activity_definitions" DROP COLUMN "kind";

-- 3) complementary
ALTER TABLE "topics" DROP COLUMN "complementary";
