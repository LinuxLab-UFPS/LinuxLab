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
 */
export function destinoSeguro(next: string | null | undefined): string {
  if (!next) return DESTINO_POR_DEFECTO

  const ruta = next.trim()
  if (!ruta.startsWith("/")) return DESTINO_POR_DEFECTO
  if (ruta.startsWith("//") || ruta.startsWith("/\\")) return DESTINO_POR_DEFECTO
  if (ruta.includes("\\")) return DESTINO_POR_DEFECTO

  return ruta
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
