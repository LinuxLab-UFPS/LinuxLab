-- Fase 2a: temario en BD + progreso por grupo.
--
-- 1) Nuevas tablas: topics, subtopics, lesson_progress.
-- 2) activity_definitions: topic_id/subtopic_id (se conserva topic_number hasta
--    la migracion que hace el backfill).
-- 3) activity_attempts: group_id (scope del check de leccion a un grupo).
-- 4) Seed del temario (fijo, RF-01) + backfill de topic_id desde topic_number
--    y de group_id en los intentos de leccion historicos.
--
-- Orden: crear tablas -> columnas -> indices -> FKs -> seed -> backfill (el
-- backfill de topic_id necesita la tabla topics poblada antes).

-- 1) Tablas
CREATE TABLE "topics" (
    "id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "complementary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subtopics" (
    "id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "number" INTEGER NOT NULL DEFAULT 0,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "subtopics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lesson_progress" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "subtopic_id" UUID NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- 2) Columnas nuevas (se conserva topic_number hasta la migracion de drop)
ALTER TABLE "activity_definitions" ADD COLUMN "subtopic_id" UUID;
ALTER TABLE "activity_definitions" ADD COLUMN "topic_id" UUID;
ALTER TABLE "activity_attempts" ADD COLUMN "group_id" UUID;

-- 3) Indices
CREATE UNIQUE INDEX "topics_number_key" ON "topics"("number");
CREATE UNIQUE INDEX "topics_slug_key" ON "topics"("slug");

CREATE INDEX "subtopics_topic_id_idx" ON "subtopics"("topic_id");
CREATE UNIQUE INDEX "subtopics_topic_id_number_key" ON "subtopics"("topic_id", "number");
CREATE UNIQUE INDEX "subtopics_topic_id_slug_key" ON "subtopics"("topic_id", "slug");

CREATE INDEX "lesson_progress_subtopic_id_idx" ON "lesson_progress"("subtopic_id");
CREATE INDEX "lesson_progress_group_id_idx" ON "lesson_progress"("group_id");
CREATE UNIQUE INDEX "lesson_progress_student_id_group_id_subtopic_id_key" ON "lesson_progress"("student_id", "group_id", "subtopic_id");

CREATE INDEX "activity_attempts_group_id_idx" ON "activity_attempts"("group_id");

-- 4) FKs
ALTER TABLE "subtopics" ADD CONSTRAINT "subtopics_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "activity_definitions" ADD CONSTRAINT "activity_definitions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activity_definitions" ADD CONSTRAINT "activity_definitions_subtopic_id_fkey" FOREIGN KEY ("subtopic_id") REFERENCES "subtopics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activity_attempts" ADD CONSTRAINT "activity_attempts_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_subtopic_id_fkey" FOREIGN KEY ("subtopic_id") REFERENCES "subtopics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5) Seed del temario (fijo, RF-01). Slugs de tema derivados del titulo
--    (slugify), coincidiendo con temario.ts. Subtopics con contenido (temas
--    1-7) traen el slug/id real de su meta.json; los temas 8-10 no tienen
--    contenido aun, solo se registra el tema.

INSERT INTO "topics" ("id", "number", "slug", "title", "description", "complementary", "order") VALUES
(gen_random_uuid(), 1,  'introduccion-a-linux',  'Introducción a Linux',   'Historia, kernel, entorno de ventanas e instalación.', false, 1),
(gen_random_uuid(), 2,  'la-terminal',           'La Terminal',            'La línea de comandos, una introducción al shell Bash y los comandos esenciales para moverte por el sistema.', false, 2),
(gen_random_uuid(), 3,  'directorios',           'Directorios',            'Tipos de directorios, la jerarquía del sistema, navegación y operaciones con directorios.', false, 3),
(gen_random_uuid(), 4,  'manejo-de-archivos',    'Manejo de Archivos',     'Crear, copiar, mover y borrar archivos, seleccionarlos con comodines, encadenar comandos con pipes y los editores de texto.', false, 4),
(gen_random_uuid(), 5,  'permisos',              'Permisos',               'Dueño, grupo y permisos de archivos y directorios, notación octal, chmod y umask.', false, 5),
(gen_random_uuid(), 6,  'compresion',            'Compresión',             'Compresión de archivos con tar, gzip, bzip2 y zip.', false, 6),
(gen_random_uuid(), 7,  'busqueda',              'Búsqueda',               'Buscar texto dentro de los archivos con grep, localizar archivos con find y ordenar los resultados.', false, 7),
(gen_random_uuid(), 8,  'usuarios-y-grupos',     'Usuarios y grupos',      'passwd, shadow y creación de cuentas con useradd y groupadd.', false, 8),
(gen_random_uuid(), 9,  'gestion-de-procesos',   'Gestión de procesos',    'ps, top, kill, jobs y manejo de primer y segundo plano (fg, bg, &).', false, 9),
(gen_random_uuid(), 10, 'shell-scripting',       'Shell scripting',        'Variables, condicionales, ciclos y funciones en Bash.', false, 10);

INSERT INTO "subtopics" ("id", "topic_id", "number", "title", "slug", "order") VALUES
-- Tema 1
(gen_random_uuid(), (SELECT id FROM topics WHERE number=1), 1, 'Linux: Dónde todo empezó',   'historia',         1),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=1), 2, 'El Kernel',                  'kernel',           2),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=1), 3, 'Entorno de ventanas',        'entorno-ventanas', 3),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=1), 4, 'Instalación',                'instalacion',      4),
-- Tema 2
(gen_random_uuid(), (SELECT id FROM topics WHERE number=2), 1, 'La línea de comandos',       'terminal',             1),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=2), 2, 'Anatomía de un comando',     'anatomia-comando',     2),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=2), 3, 'Variables en Bash',          'variables',            3),
-- Tema 3
(gen_random_uuid(), (SELECT id FROM topics WHERE number=3), 1, 'El sistema de archivos',     'filesystem',            1),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=3), 2, 'Navegación esencial',        'navegacion',            2),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=3), 3, 'Operaciones con directorios','operaciones-directorios',3),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=3), 4, 'Práctica: crea tu estructura','practica-directorios', 4),
-- Tema 4
(gen_random_uuid(), (SELECT id FROM topics WHERE number=4), 1, 'Crear archivos',             'touch',        1),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=4), 2, 'Copiar, mover y borrar',     'copiar-borrar', 2),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=4), 3, 'Comodines',                  'comodines',     3),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=4), 4, 'Encadenar comandos',         'pipes',         4),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=4), 5, 'Editores de texto',          'editores',      5),
-- Tema 5
(gen_random_uuid(), (SELECT id FROM topics WHERE number=5), 1, 'Dueño, grupo y permisos',    'dueno-y-permisos', 1),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=5), 2, 'Notación octal',             'octal',             2),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=5), 3, 'Cambiar permisos con chmod', 'chmod',             3),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=5), 4, 'Permisos sobre directorios', 'directorios',       4),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=5), 5, 'Permisos por defecto',       'umask',             5),
-- Tema 6
(gen_random_uuid(), (SELECT id FROM topics WHERE number=6), 1, 'Comprimir y descomprimir',   'comprimir', 1),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=6), 2, 'Empaquetar con tar',         'tar',        2),
-- Tema 7
(gen_random_uuid(), (SELECT id FROM topics WHERE number=7), 1, 'Buscar dentro de los archivos', 'grep',                 1),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=7), 2, 'Expresiones regulares',         'expresiones-regulares',2),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=7), 3, 'Buscar archivos con find',      'find',                 3),
(gen_random_uuid(), (SELECT id FROM topics WHERE number=7), 4, 'Ordenar los resultados',        'ordenar',              4);

-- 6) Backfill: activity_definitions.topic_id desde topic_number
UPDATE "activity_definitions" d
SET "topic_id" = (SELECT t.id FROM topics t WHERE t.number = d.topic_number)
WHERE d.topic_number IS NOT NULL;

-- 7) Backfill best-effort: group_id en intentos de leccion historicos
--    (sin group_activity_id), asignando al estudiante el grupo activo vigente.
--    Los de estudiantes sin grupo activo quedan NULL.
UPDATE "activity_attempts" a
SET "group_id" = (
    SELECT e.group_id FROM enrollments e
    JOIN groups g ON g.id = e.group_id
    WHERE e.student_id = a.student_id
      AND e.status = 'active'
      AND g.archived = false
    ORDER BY e.enrolled_at ASC
    LIMIT 1
)
WHERE a.group_activity_id IS NULL AND a.group_id IS NULL;
