/**
 * Nota final de una actividad para un estudiante segun la politica configurada.
 *
 * - `best_score`: la puntuacion mas alta de los intentos validos.
 * - `latest_score`: la del ultimo intento valido (por created_at).
 *
 * Sin intentos la nota es 0: toda actividad cuenta para el promedio, y tener
 * "vacio" en una consulta no equivale a "sin calificar". Como la nota sale de
 * una derivada (nunca se persiste un registro falso de 0), quienes la usen
 * pueden distinguir el "nunca intento" con el contador de intentos.
 *
 * `scores` es un arreglo de `{ score, created_at }` ordenado como venga; el
 * ultimo se toma por fecha, no por posicion de llegada.
 */
function finalScore(scores, policy) {
  if (!Array.isArray(scores) || scores.length === 0) return 0

  if (policy === "latest_score") {
    const latest = scores.reduce((a, b) =>
      new Date(a.created_at) > new Date(b.created_at) ? a : b,
    )
    return normalizedScore(latest.score)
  }

  const best = Math.max(...scores.map((s) => Number(s.score) || 0))
  return normalizedScore(best)
}

/** Acota la nota a la escala 0-100 (defensivo; el backend ya la persiste asi). */
function normalizedScore(value) {
  const n = Number(value) || 0
  return Math.max(0, Math.min(100, n))
}

module.exports = { finalScore }