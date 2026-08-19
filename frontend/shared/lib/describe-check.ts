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
 * Describe qué verifica una aserción del catálogo, en lenguaje natural, a
 * partir de sus parámetros esperados (sin evaluar nada). Es la lectura legible
 * que reemplaza al `type` + JSON para el docente.
 */
export function describeCheck(type: string, params: Record<string, unknown>): string {
  const base = (key: string) => String(params[key] ?? "")
  const name = fileBasename(base("ruta"))

  switch (type) {
    case "directorio_existe":
      return `Verifica que exista el directorio '${name}'`
    case "archivo_existe":
      return `Verifica que exista el archivo '${name}'`
    case "archivo_no_existe":
      return `Verifica que '${name}' ya no exista`
    case "permisos_son":
      return `Verifica que '${name}' tenga permisos ${base("modo")} (${permsToSentence(base("modo"))})`
    case "propietario_es":
      return base("usuario") === "$usuario"
        ? `Verifica que '${name}' pertenezca al estudiante`
        : `Verifica que '${name}' pertenezca a '${base("usuario")}'`
    case "archivo_contiene":
      return `Verifica que '${name}' contenga el texto '${base("patron")}'`
    case "minimo_lineas":
      return `Verifica que '${name}' tenga al menos ${base("cantidad")} líneas con contenido`
    case "archivo_es":
      return `Verifica que '${name}' tenga el contenido exacto esperado`
    case "ultima_linea_es":
      return `Verifica que la última línea de '${name}' sea '${base("valor")}'`
    default:
      return type
  }
}
