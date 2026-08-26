-- Allow a subtopic to host more than one activity (remove the one-to-one
-- uniqueness on TopicActivity.subtopic_id). Progress gating now requires all
-- activities of a subtopic to be approved (see progressService.js).
DROP INDEX IF EXISTS "TopicActivity_subtopic_id_key";
