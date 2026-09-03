import type { ActivityCheck } from "@/lib/features/teacher/types"

/**
 * Validacion de aserciones en el cliente, espejo de `checkCatalogService.js`
 * (backend) y de la regla de rutas relativas de `groupActivityService.js`.
 *
 * El backend sigue siendo la fuente de verdad al publicar; esto existe para
 * que el asistente bloquee el avance con un mensaje puntual en vez de dejar
 * que el servidor rechace todo el formulario. Si se agrega un tipo nuevo al
 * catalogo, su validacion se repite aqui.
 */

const value = (params: Record<string, string>, key: string) =>
  String(params[key] ?? "").trim()

function rutaError(params: Record<string, string>): string | null {
  const ruta = value(params, "ruta")
  if (!ruta) return "Falta la ruta"
  if (ruta.startsWith("/") || ruta.split("/").includes("..")) {
    return "La ruta debe ser relativa a la carpeta de trabajo (sin '/' inicial ni '..')"
  }
  return null
}

/** El primer problema de los parámetros de una aserción, o null si es válida. */
export function checkError(check: ActivityCheck): string | null {
  const ruta = rutaError(check.params)
  if (ruta) return ruta

  if (!Number.isInteger(check.points) || check.points < 0) {
    return "El puntaje debe ser un entero mayor o igual a 0"
  }

  switch (check.type) {
    case "permisos_son":
      if (!/^[0-7]{3,4}$/.test(value(check.params, "modo"))) {
        return "El modo debe ser octal (ej: 755)"
      }
      return null
    case "propietario_es":
      return value(check.params, "usuario") ? null : "Falta el usuario esperado"
    case "archivo_contiene":
      return value(check.params, "patron") ? null : "Falta el patrón a buscar"
    case "minimo_lineas":
      return /^[1-9]\d*$/.test(value(check.params, "cantidad"))
        ? null
        : "La cantidad debe ser un entero positivo"
    case "archivo_es":
    case "ultima_linea_es":
      return value(check.params, "valor") ? null : "Falta el valor esperado"
    case "directorio_existe":
    case "archivo_existe":
    case "archivo_no_existe":
      return null
    default:
      return null
  }
}
