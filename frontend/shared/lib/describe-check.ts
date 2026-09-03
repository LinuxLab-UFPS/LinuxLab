/** Traduce un dígito octal (0-7) a la descripción en lenguaje natural. */
function octalToPermDesc(digit: string): string {
  switch (digit) {
    case "7":
      return "lectura, escritura y ejecución"
    case "6":
      return "lectura y escritura"
    case "5":
      return "lectura y ejecución"
    case "4":
      return "solo lectura"
    case "3":
      return "escritura y ejecución"
    case "2":
      return "solo escritura"
    case "1":
      return "solo ejecución"
    default:
      return "sin permisos"
  }
}

const OWNER_LABELS = ["el propietario", "el grupo", "otros"]

/** Describe un modo octal (ej: "755") como frase legible en español. */
export function permsToSentence(modo: string): string {
  const digits = String(modo).slice(-3).split("")
  return digits
    .map((d, i) => `${octalToPermDesc(d)} para ${OWNER_LABELS[i]}`)
    .join(", ")
}

/** Último segmento de una ruta; si queda vacío, un sustantivo genérico. */
function fileBasename(ruta: string): string {
  const name = String(ruta ?? "").split("/").filter(Boolean).pop()
  return name ?? "el archivo"
}

/**
 * Lo que se le enseña al estudiante de una comprobación.
 *
 * Solo el tipo. `describeCheck` escribe el valor esperado dentro de la frase
 * («contenga el texto 'catalogo'», «sea '/bin/bash'», «permisos 755»), asi que
 * mostrarsela al estudiante le entrega la respuesta antes de intentar nada. El
 * servidor ya no manda los `params` a la vista del estudiante; esta funcion es
 * la que decide qué se puede decir sin ellos.
 */
export function describeCheckForStudent(type: string): string {
  switch (type) {
    case "directorio_existe":
      return "Crea el directorio que pide el enunciado en tu carpeta de trabajo"
    case "archivo_existe":
      return "Crea el archivo que pide el enunciado en tu carpeta de trabajo"
    case "archivo_no_existe":
      return "Elimina de tu carpeta el archivo que pide el enunciado"
    case "permisos_son":
      return "Deja los permisos del archivo tal como los pide el enunciado"
    case "propietario_es":
      return "Deja el archivo a nombre del dueño que pide el enunciado"
    case "archivo_contiene":
      return "Escribe dentro del archivo el texto que pide el enunciado"
    case "minimo_lineas":
      return "Escribe en el archivo las líneas mínimas que pide el enunciado"
    case "archivo_es":
      return "Deja el contenido del archivo exactamente como lo pide el enunciado"
    case "ultima_linea_es":
      return "Termina el archivo con la última línea que pide el enunciado"
    default:
      return "Completa la comprobación del enunciado"
  }
}

/**
 * Resumen compacto de los parametros de una asercion, para la fila colapsada
 * del constructor: 'informe.txt', 'informe.txt • "hola"', 'ficha.txt • ≥ 20
 * lineas'. Es vista de docente, asi que si mostrar el valor esperado.
 */
export function checkParamsSummary(type: string, params: Record<string, unknown>): string {
  const base = (key: string) => String(params[key] ?? "").trim()
  const name = fileBasename(base("ruta"))
  const quote = (v: string) => `"${v.length > 24 ? `${v.slice(0, 24)}…` : v}"`

  switch (type) {
    case "permisos_son":
      return base("modo") ? `${name} • ${base("modo")}` : name
    case "propietario_es":
      return base("usuario") ? `${name} • ${base("usuario")}` : name
    case "archivo_contiene":
      return base("patron") ? `${name} • ${quote(base("patron"))}` : name
    case "minimo_lineas":
      return base("cantidad") ? `${name} • ≥ ${base("cantidad")} líneas` : name
    case "ultima_linea_es":
      return base("valor") ? `${name} • ${quote(base("valor"))}` : name
    case "archivo_es":
      return base("valor") ? `${name} • contenido exacto` : name
    default:
      return name
  }
}

/**
 * Frase breve de qué hace una asercion, para listados de solo lectura (el
 * resumen del asistente). Entre `checkParamsSummary` (solo parametros) y
 * `describeCheck` (la frase completa del docente): dice la accion y el
 * objetivo sin la parte larga de "del directorio de trabajo", y los valores
 * largos se recortan.
 */
export function describeCheckShort(type: string, params: Record<string, unknown>): string {
  const base = (key: string) => String(params[key] ?? "").trim()
  const name = fileBasename(base("ruta"))
  const quote = (v: string) => `"${v.length > 24 ? `${v.slice(0, 24)}…` : v}"`

  switch (type) {
    case "directorio_existe":
      return `Verifica que exista el directorio '${name}'`
    case "archivo_existe":
      return `Verifica que exista el archivo '${name}'`
    case "archivo_no_existe":
      return `Verifica que '${name}' ya no exista`
    case "permisos_son":
      return base("modo")
        ? `Verifica que '${name}' tenga permisos ${base("modo")}`
        : `Verifica los permisos de '${name}'`
    case "propietario_es":
      return base("usuario") === "$usuario"
        ? `Verifica que '${name}' sea del estudiante`
        : base("usuario")
          ? `Verifica que '${name}' sea de '${base("usuario")}'`
          : `Verifica el propietario de '${name}'`
    case "archivo_contiene":
      return base("patron")
        ? `Verifica que '${name}' contenga ${quote(base("patron"))}`
        : `Verifica el contenido de '${name}'`
    case "minimo_lineas":
      return base("cantidad")
        ? `Verifica que '${name}' tenga al menos ${base("cantidad")} líneas`
        : `Verifica el mínimo de líneas de '${name}'`
    case "archivo_es":
      return `Verifica que '${name}' tenga el contenido exacto esperado`
    case "ultima_linea_es":
      return base("valor")
        ? `Verifica que la última línea de '${name}' sea ${quote(base("valor"))}`
        : `Verifica la última línea de '${name}'`
    default:
      return checkParamsSummary(type, params)
  }
}

/**
 * Describe qué verifica una aserción del catálogo, en lenguaje natural, a
 * partir de sus parámetros esperados (sin evaluar nada). Es la lectura legible
 * que reemplaza al `type` + JSON para el docente.
 *
 * Solo para vistas de docente: incluye los valores esperados. Para el
 * estudiante, `describeCheckForStudent`.
 */
export function describeCheck(type: string, params: Record<string, unknown>): string {
  const base = (key: string) => String(params[key] ?? "")
  const name = fileBasename(base("ruta"))

  switch (type) {
    case "directorio_existe":
      return `Verifica que en el directorio de trabajo exista el directorio '${name}'`
    case "archivo_existe":
      return `Verifica que en el directorio de trabajo exista el archivo '${name}'`
    case "archivo_no_existe":
      return `Verifica que en el directorio de trabajo '${name}' ya no exista`
    case "permisos_son":
      return `Verifica que en el directorio de trabajo '${name}' tenga permisos ${base("modo")} (${permsToSentence(base("modo"))})`
    case "propietario_es":
      return base("usuario") === "$usuario"
        ? `Verifica que en el directorio de trabajo '${name}' pertenezca al estudiante`
        : `Verifica que en el directorio de trabajo '${name}' pertenezca a '${base("usuario")}'`
    case "archivo_contiene":
      return `Verifica que el archivo '${name}' del directorio de trabajo contenga el texto '${base("patron")}'`
    case "minimo_lineas":
      return `Verifica que el archivo '${name}' del directorio de trabajo tenga al menos ${base("cantidad")} líneas con contenido`
    case "archivo_es":
      return `Verifica que el archivo '${name}' del directorio de trabajo tenga el contenido exacto esperado`
    case "ultima_linea_es":
      return `Verifica que la última línea del archivo '${name}' del directorio de trabajo sea '${base("valor")}'`
    default:
      return type
  }
}
