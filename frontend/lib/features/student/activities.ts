/**
 * Suggested activities seam (student side). No backend endpoint exists yet for
 * per-student activity recommendations, so this returns fixed placeholder data
 * for now, clearly marked below. Swap the body of getSuggestedActivities() for
 * a real fetch once the backend supports it; the shape (SuggestedActivity)
 * should stay compatible with what the terminal page already renders.
 */
export interface SuggestedActivity {
  id: string
  title: string
  description: string
}

// ###########################################################################
// ## TEMPORAL: no hay actividades reales todavía (ningún endpoint de        ##
// ## sugerencias existe). Estas 2 son solo para poder ver y probar la       ##
// ## interacción de clic -> detalle -> Siguiente. Quitar cuando haya datos  ##
// ## reales del backend.                                                    ##
// ###########################################################################
const PLACEHOLDER_ACTIVITIES: SuggestedActivity[] = [
  {
    id: "demo-1",
    title: "Actividad de ejemplo 1",
    description:
      "Descripción de la actividad - Lorem ipsum Lorem ipsum Lorem ipsum ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum.",
  },
  {
    id: "demo-2",
    title: "Actividad de ejemplo 2",
    description: "Descripción de la actividad - Lorem ipsum Lorem ipsum Lorem ipsum ipsum.",
  },
]

export function getSuggestedActivities(): SuggestedActivity[] {
  return PLACEHOLDER_ACTIVITIES
}
