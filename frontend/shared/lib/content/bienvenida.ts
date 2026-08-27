/**
 * La seccion de bienvenida: la portada del curso y el mapa de progreso.
 *
 * Vive FUERA de `syllabus` a proposito, y no es un descuido:
 *
 * - El numero de tema construye rutas por todas partes (`tema-NN`, los assets,
 *   los seeds de las actividades). Meter una entrada al principio obligaba a
 *   renumerar los diez temas y las setenta y tantas referencias que los nombran.
 * - `isTopicDone` (course-progress.ts) da por no hecho todo tema sin lecciones,
 *   pero el tema sigue contando en el denominador. Una portada dentro del
 *   temario dejaria el 100% fuera de alcance para siempre.
 *
 * Asi que esto no es un tema: es lo que hay antes de empezar. No se siembra, no
 * puntua y no aparece en el progreso.
 */

export interface PaginaBienvenida {
  id: string
  title: string
  /** El markdown que la acompaña; el roadmap se dibuja solo, sin archivo. */
  file?: string
  /** Se pinta en vez del markdown. */
  kind?: "roadmap"
}

export interface SeccionBienvenida {
  slug: string
  title: string
  description: string
  pages: PaginaBienvenida[]
}

export const bienvenida: SeccionBienvenida = {
  slug: "bienvenida",
  title: "Bienvenida",
  description: "Qué vas a aprender y con qué cuentas para lograrlo.",
  pages: [
    {
      id: "introduccion",
      title: "Introducción al curso",
      file: "01-introduccion.md",
    },
    {
      id: "roadmap",
      title: "Tu ruta de aprendizaje",
      kind: "roadmap",
    },
  ],
}

/** Si un slug de la URL apunta a la bienvenida. */
export function esBienvenida(slug: string | undefined): boolean {
  return slug === bienvenida.slug
}

/** La pagina pedida, o la primera si no se indica ninguna. */
export function paginaBienvenida(id: string | undefined): PaginaBienvenida | null {
  if (!id) return bienvenida.pages[0] ?? null
  return bienvenida.pages.find((p) => p.id === id) ?? bienvenida.pages[0] ?? null
}
