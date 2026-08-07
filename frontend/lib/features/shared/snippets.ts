/**
 * Blocks of text a lesson hands to the student without showing them.
 *
 * The point is that the student moves something he did not type: copy it, get
 * it into a file, and prove it arrived intact. Showing it would let him retype
 * it by hand, which is a different exercise.
 *
 * OJO: si cambias un snippet que tenga comprobación, hay que resembrar la
 * actividad — el patrón que revisa el laboratorio vive en su semilla.
 */
export interface Snippet {
  id: string
  /** What the button says it will copy, without revealing it. */
  label: string
  content: string
}

/** UFPS calado en blanco sobre rojo, con marco. Las filas 2, 4 y 6 son las que
 *  revisa la comprobación (ver seed-comprobacion-logo.js). */
const LOGO_UFPS = [
  "🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥",
  "🟥⬜🟥⬜🟥⬜⬜⬜🟥⬜⬜⬜🟥⬜⬜⬜🟥",
  "🟥⬜🟥⬜🟥⬜🟥🟥🟥⬜🟥⬜🟥⬜🟥🟥🟥",
  "🟥⬜🟥⬜🟥⬜⬜🟥🟥⬜⬜⬜🟥⬜⬜⬜🟥",
  "🟥⬜🟥⬜🟥⬜🟥🟥🟥⬜🟥🟥🟥🟥🟥⬜🟥",
  "🟥⬜⬜⬜🟥⬜🟥🟥🟥⬜🟥🟥🟥⬜⬜⬜🟥",
  "🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥",
  "🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥",
].join("\n")

const SNIPPETS: Snippet[] = [
  { id: "logo-ufps", label: "Copiar el logo", content: LOGO_UFPS },
]

export function getSnippet(id: string): Snippet | undefined {
  return SNIPPETS.find((snippet) => snippet.id === id)
}
