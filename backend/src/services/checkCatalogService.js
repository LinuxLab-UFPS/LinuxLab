/**
 * El catalogo de aserciones atomicas: el contrato entre la interfaz del
 * docente y el checker del entorno.
 *
 * Cada entrada tiene la metadata que se sirve por `GET /api/activities/catalog`
 * (para que el formulario muestre exactamente lo que el backend acepta) y el
 * validador de sus parametros. Agregar un tipo nuevo es: implementarlo en
 * `entorno/scripts/checker.py` (la autoridad final de evaluacion) y anadirlo
 * aqui — la interfaz lo muestra solo.
 *
 * La `ruta` de cada asercion es RELATIVA a la carpeta de trabajo de la
 * actividad (`~/actividades/<workdir>/`): el docente escribe solo el archivo o
 * directorio que va a verificar, y el backend la resuelve al evaluar.
 */

/** El mismo token que sustituye `checker.py` por la identidad del proceso. */
const USER_TOKEN = "$usuario"

const field = (key, label, placeholder) => ({ key, label, placeholder })

const CATALOG = [
  {
    type: "directorio_existe",
    label: "El directorio existe",
    hint: "Verifica que exista un directorio dentro de la carpeta de trabajo de la actividad.",
    fields: [field("ruta", "Directorio", "carpeta")],
    validate: ({ ruta }) => (ruta ? null : "Falta la ruta"),
  },
  {
    type: "archivo_existe",
    label: "El archivo existe",
    hint: "Verifica que exista un archivo dentro de la carpeta de trabajo de la actividad.",
    fields: [field("ruta", "Archivo", "informe.txt")],
    validate: ({ ruta }) => (ruta ? null : "Falta la ruta"),
  },
  {
    type: "archivo_no_existe",
    label: "El archivo ya no existe",
    hint: "Verifica que el archivo no exista dentro de la carpeta de trabajo de la actividad.",
    fields: [field("ruta", "Archivo", "temporal.tmp")],
    validate: ({ ruta }) => (ruta ? null : "Falta la ruta"),
  },
  {
    type: "permisos_son",
    label: "Los permisos son",
    hint: "Compara los permisos del archivo con el modo octal esperado.",
    fields: [
      field("ruta", "Archivo", "script.sh"),
      field("modo", "Modo (octal)", "755"),
    ],
    validate: ({ ruta, modo }) => {
      if (!ruta) return "Falta la ruta"
      if (!/^[0-7]{3,4}$/.test(String(modo ?? ""))) return "El modo debe ser octal (ej: 755)"
      return null
    },
  },
  {
    /* El unico propietario que se puede exigir es el propio estudiante, y por eso
       `usuario` va fijo en el token `$usuario`, que el checker sustituye por la
       identidad real del proceso al evaluar.

       Antes era un campo libre que solo se comprobaba no vacio, asi que un docente
       podia escribir ahi el nombre de una cuenta concreta. Una asercion asi es
       imposible de cumplir para el resto del curso: cada estudiante trabaja en su
       propio home, de modo que el propietario siempre es el mismo y nunca el
       nombre escrito. Ademas el enunciado se le mostraba a todos como "pertenece
       a <esa persona>", que se lee como si el progreso fuera de otro. */
    type: "propietario_es",
    label: "El propietario es el estudiante",
    hint:
      "Verifica que el archivo o directorio pertenezca al estudiante que resuelve " +
      "la actividad. El propietario siempre es él, no se puede exigir otro.",
    fields: [field("ruta", "Archivo", "archivo")],
    validate: ({ ruta, usuario }) => {
      if (!ruta) return "Falta la ruta"
      if (usuario !== undefined && usuario !== USER_TOKEN) {
        return "El propietario solo puede ser el estudiante que resuelve la actividad"
      }
      return null
    },
  },
  {
    type: "archivo_contiene",
    label: "El archivo contiene",
    hint: "Busca un texto o patrón dentro del contenido del archivo.",
    fields: [
      field("ruta", "Archivo", "config.txt"),
      field("patron", "Texto o patrón", "export PATH="),
    ],
    validate: ({ ruta, patron }) => {
      if (!ruta) return "Falta la ruta"
      if (patron === undefined || patron === null || patron === "") return "Falta el patrón a buscar"
      return null
    },
  },
  {
    type: "minimo_lineas",
    label: "Tiene al menos N líneas",
    hint: "Verifica que el archivo tenga una cantidad mínima de líneas.",
    fields: [
      field("ruta", "Archivo", "ficha.txt"),
      field("cantidad", "Cantidad mínima", "5"),
    ],
    validate: ({ ruta, cantidad }) => {
      if (!ruta) return "Falta la ruta"
      if (!/^[1-9]\d*$/.test(String(cantidad ?? ""))) return "La cantidad debe ser un entero positivo"
      return null
    },
  },
  {
    type: "archivo_es",
    label: "El archivo es exactamente",
    hint: "Compara el contenido completo del archivo con el valor esperado.",
    fields: [
      field("ruta", "Archivo", "logo.txt"),
      field("valor", "Contenido esperado", "…"),
    ],
    validate: ({ ruta, valor }) => {
      if (!ruta) return "Falta la ruta"
      if (valor === undefined || valor === null) return "Falta el valor esperado"
      return null
    },
  },
  {
    type: "ultima_linea_es",
    label: "La última línea es",
    hint: "Verifica el contenido de la última línea del archivo.",
    fields: [
      field("ruta", "Archivo", "ficha.txt"),
      field("valor", "Valor esperado", "$correo"),
    ],
    validate: ({ ruta, valor }) => {
      if (!ruta) return "Falta la ruta"
      if (valor === undefined || valor === null) return "Falta el valor esperado"
      return null
    },
  },
]

/** Los tipos que el checker del entorno conoce, en el orden del catalogo. */
const TYPES = new Set(CATALOG.map((entry) => entry.type))

/** El validador de un tipo, o undefined si el tipo no existe. */
function validatorOf(type) {
  return CATALOG.find((entry) => entry.type === type)?.validate
}

function isKnown(type) {
  return TYPES.has(type)
}

/**
 * Deja los parametros como los espera el checker.
 *
 * Hoy solo actua sobre `propietario_es`, cuyo `usuario` va siempre en el token:
 * el formulario ya no manda ese campo, y asi la asercion queda bien formada
 * tanto si viene vacio como si llega un valor de una version anterior.
 */
function normalizeParams(type, params) {
  if (type !== "propietario_es") return params
  return { ...params, usuario: USER_TOKEN }
}

/** La forma publica que se sirve por API (sin validadores). */
function publicCatalog() {
  return CATALOG.map(({ type, label, hint, fields }) => ({ type, label, hint, fields }))
}

/** El catalogo de aserciones que puede usar el docente al crear actividades. */
function getCatalog() {
  return publicCatalog()
}

module.exports = { CATALOG, isKnown, validatorOf, normalizeParams, publicCatalog, getCatalog, USER_TOKEN }
