/** Color de la nota según la escala del curso: rojo < 60, ámbar >= 60, verde >= 80. */
export function scoreColor(score: number) {
  if (score >= 80) return "text-success"
  if (score >= 60) return "text-warning"
  return "text-danger"
}

/** Relleno (hex sin "#") para hojas de cálculo, espejo de scoreColor. */
export function scoreFillColor(score: number): string {
  if (score >= 80) return "DCFCE7"
  if (score >= 60) return "FEF3C7"
  return "FEE2E2"
}
