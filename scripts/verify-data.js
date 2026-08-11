#!/usr/bin/env node
/**
 * Snapshot del estado de la data de actividades (modelo nuevo).
 *
 * Se corre ANTES y DESPUES de la migracion para comprobar que nada se pierde:
 * mismos conteos, mismos IDs y el detalle de cada intento intacto (los campos
 * de valor no deben moverse; solo puede cambiar el re-apuntado a la publicacion
 * del grupo y la numeracion de intentos).
 *
 * Uso:
 *   DATABASE_URL="postgresql://..." node scripts/verify-data.js
 */
const { Client } = require("pg")

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error("Falta DATABASE_URL")
    process.exit(1)
  }

  const client = new Client({ connectionString: url })
  await client.connect()

  const snapshot = {}

  const table = async (name, sqlTable) => {
    const ids = await client.query(`SELECT id FROM "${sqlTable}" ORDER BY id`)
    const count = await client.query(`SELECT count(*)::int AS n FROM "${sqlTable}"`)
    return { count: count.rows[0].n, ids: ids.rows.map((r) => r.id) }
  }

  snapshot.definitions = await table("definitions", "activity_definitions")
  snapshot.checks = await table("checks", "activity_checks")
  snapshot.attempts = await table("attempts", "activity_attempts")

  snapshot.groupActivities = await table("groupActivities", "group_activities")

  snapshot.definitionsDetail = (
    await client.query(
      `SELECT id, slug, kind, title, source, active, activity_type, evaluation_type,
              max_score, created_by IS NOT NULL AS has_creator
       FROM activity_definitions ORDER BY id`,
    )
  ).rows

  snapshot.attemptsPerDefinition = (
    await client.query(
      `SELECT activity_definition_id, count(*)::int AS n
       FROM activity_attempts GROUP BY activity_definition_id ORDER BY activity_definition_id`,
    )
  ).rows

  snapshot.attemptsDetail = (
    await client.query(
      `SELECT id, activity_definition_id, group_activity_id, student_id,
              attempt_number, passed, score, created_at::text AS created_at
       FROM activity_attempts ORDER BY created_at, id`,
    )
  ).rows

  snapshot.groupActivitiesDetail = (
    await client.query(
      `SELECT id, group_id, activity_definition_id, title, evaluation_type,
              jsonb_array_length(checks) AS checks_count, attempt_limit,
              grading_policy, required, enabled, published_at IS NOT NULL AS published
       FROM group_activities ORDER BY activity_definition_id`,
    )
  ).rows

  console.log(JSON.stringify(snapshot, null, 2))
  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
