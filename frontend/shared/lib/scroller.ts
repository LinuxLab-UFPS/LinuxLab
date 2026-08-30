/**
 * El ancestro que hace scroll, o `null` si el que scrollea es la ventana.
 *
 * Se busca en vez de recibirse para que quien lo use valga en las dos
 * disposiciones: las paginas del area de estudiante meten su contenido dentro
 * de un `<main>` con scroll propio (para que la barra del navegador no corra
 * por al lado de la cabecera), pero el mismo componente tiene que seguir
 * funcionando si algun dia cuelga directamente del documento.
 *
 * Vivia dentro de `lesson-scroll-area.tsx`, que fue quien se topo con el
 * problema primero. Salio de ahi al necesitarlo tambien el bloque de la
 * portada, porque un `IntersectionObserver` con el `root` por defecto observa
 * el viewport del documento y no ese `<main>`.
 */
export function scrollerDe(nodo: HTMLElement | null): HTMLElement | null {
  let padre = nodo?.parentElement ?? null
  while (padre) {
    const desborde = getComputedStyle(padre).overflowY
    if (desborde === "auto" || desborde === "scroll") return padre
    padre = padre.parentElement
  }
  return null
}
