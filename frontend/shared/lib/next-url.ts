/**
 * A donde volver despues de iniciar sesion.
 *
 * Antes toda redireccion por falta de sesion era un `redirect("/")` pelado: se
 * perdia el destino, y quien pulsaba «Comenzar» en la portada acababa en el
 * login sin que nada lo llevara ya al curso. Ahora el destino viaja en `?next=`
 * y el login lo usa al terminar.
 *
 * Lo importante de este archivo es `destinoSeguro`. Un `next` llega desde la
 * URL, asi que lo escribe quien quiera: sin validarlo, `?next=https://otro.sitio`
 * convierte nuestro login en un trampolin para llevarse a un estudiante a una
 * copia falsa justo despues de que confie en la pagina. Por eso solo se aceptan
 * rutas de esta misma aplicacion.
 */

/** A donde va quien entra sin pedir ningun sitio en concreto. */
export const DESTINO_POR_DEFECTO = "/inicio"

/** La ruta del login, en un solo sitio para no repetirla por medio proyecto. */
export const RUTA_LOGIN = "/login"

/**
 * Comprueba que el destino sea una ruta interna.
 *
 * Se rechaza todo lo que pueda salir del sitio:
 *   - lo que no empiece por `/` (`https://otro.sitio`, `javascript:…`),
 *   - lo que empiece por `//` o `/\`, que el navegador lee como otro dominio
 *     («protocol-relative»: `//otro.sitio` va a otro.sitio, no a una ruta),
 *   - lo que traiga `\` , que algunos navegadores normalizan a `/`.
 *
 * Devuelve el veredicto sin maquillarlo: `destinoSeguro` usa esto para decidir
 * si manda a su destino por defecto, y `BackButton` para saber si un `origen`
 * que llegó por la URL es de fiar o debe caer a su fallback.
 */
export function esRutaInterna(next: string | null | undefined): boolean {
  const ruta = next?.trim()
  if (!ruta) return false
  if (!ruta.startsWith("/")) return false
  if (ruta.startsWith("//") || ruta.startsWith("/\\")) return false
  if (ruta.includes("\\")) return false
  return true
}

export function destinoSeguro(next: string | null | undefined): string {
  if (!next) return DESTINO_POR_DEFECTO
  if (!esRutaInterna(next)) return DESTINO_POR_DEFECTO
  return next.trim()
}

/**
 * La URL del login que recuerda a donde iba el visitante.
 *
 * Sin destino, o con el destino por defecto, devuelve el login a secas: no
 * tiene sentido arrastrar `?next=/home` cuando es justo a donde se va solo.
 */
export function conNext(destino?: string | null): string {
  const ruta = destinoSeguro(destino)
  if (ruta === DESTINO_POR_DEFECTO) return RUTA_LOGIN
  return `${RUTA_LOGIN}?next=${encodeURIComponent(ruta)}`
}

/**
 * Añade el origen a un enlace de entrada, para que `BackButton` sepa a dónde
 * volver. El origen viaja codificado porque puede ser una ruta con sus propios
 * parámetros (`/curso?tema=x&sub=y`): cae en la URL como `?origen=...` y el
 * botón lo valida con `esRutaInterna` antes de usarlo.
 */
export function conOrigen(destino: string, origen: string): string {
  return `${destino}${destino.includes("?") ? "&" : "?"}origen=${encodeURIComponent(origen)}`
}
