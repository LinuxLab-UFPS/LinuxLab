-- Sin estado borrador: crear una actividad es publicarla. `created_at` ya
-- guarda el momento en que nacio la publicacion, asi que `published_at` era
-- redundante y sugeria un estado (draft/published) que el proyecto no usa.

BEGIN;

ALTER TABLE "group_activities" DROP COLUMN "published_at";

COMMIT;
