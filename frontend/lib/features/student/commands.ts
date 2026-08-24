/**
 * Every command the course teaches, each tied to the lesson that introduces it.
 *
 * The list covers the whole syllabus, not just what is written already: the
 * student is meant to see the road ahead in the picker and in the cheat sheet.
 * A command only becomes *available* once its lesson is read — `topicNumber` and
 * `subtopicId` match the keys the progress store uses — so the sheet grows with
 * the course instead of spoiling what comes later.
 *
 * A command whose lesson has no published content yet simply stays unlearned.
 *
 * Tampoco entra el comodin `*`: no es un comando que se teclee, es algo que el
 * shell hace con lo que escribes, y como tarjeta al lado de `cp` o `rm` daba a
 * entender lo contrario.
 *
 * Lo que NO entra: lo que el estudiante no puede ejecutar de verdad en el
 * laboratorio. `systemctl` es un guión que finge su salida; `apt` y `dpkg` no
 * tienen red (el entorno vive en la red interna) ni root; `sudo` y `passwd`
 * fallan siempre para una cuenta de estudiante; `chown` solo lo puede usar root;
 * y `ps`, `top` y `kill` se quedan en casi nada con `hidepid=2`, que oculta los
 * procesos ajenos. Enseñarlos es del temario; esta hoja es de lo que se teclea.
 */
export interface EssentialCommand {
  name: string
  args?: string
  description: string
  topicNumber: number
  subtopicId: string
  /** El grupo con el que se muestra en el selector. Ver CATEGORIAS. */
  categoria: Categoria
}

/**
 * Las categorias, en el orden en que se pintan. Agrupan por lo que el
 * estudiante quiere hacer, no por el tema que los enseño: quien abre el
 * selector busca "como copio un archivo", no "que salia en el tema 4".
 *
 * Van de a cuatro porque cuatro es lo que cabe en una fila del selector y es
 * tambien lo que se puede fijar debajo de la terminal. Las dos ultimas tienen
 * menos: preferimos un grupo corto y honesto a rellenarlo con un comando que no
 * pinta nada ahi.
 */
export const CATEGORIAS = [
  "Moverse por el sistema",
  "Leer archivos",
  "Crear y editar",
  "Copiar, mover y borrar",
  "Buscar y contar",
  "Permisos y cuenta",
  "Comprimir y empaquetar",
  "Variables del entorno",
  "Procesos",
  "Escribir scripts",
] as const

export type Categoria = (typeof CATEGORIAS)[number]

export const COMMANDS: EssentialCommand[] = [
  // Moverse por el sistema
  { name: "pwd", description: "Imprime el directorio actual.", topicNumber: 3, subtopicId: "filesystem", categoria: "Moverse por el sistema" },
  { name: "cd", args: "<ruta>", description: "Cambia de directorio.", topicNumber: 3, subtopicId: "filesystem", categoria: "Moverse por el sistema" },
  { name: "ls", args: "[-la]", description: "Lista el contenido de un directorio.", topicNumber: 2, subtopicId: "anatomia-comando", categoria: "Moverse por el sistema" },
  { name: "tree", args: "[ruta]", description: "Muestra la estructura en forma de arbol.", topicNumber: 3, subtopicId: "navegacion", categoria: "Moverse por el sistema" },

  // Leer archivos
  { name: "cat", args: "<archivo>", description: "Muestra el contenido de un archivo.", topicNumber: 4, subtopicId: "touch", categoria: "Leer archivos" },
  { name: "head", args: "[-n N] <archivo>", description: "Muestra las primeras lineas.", topicNumber: 4, subtopicId: "pipes", categoria: "Leer archivos" },
  { name: "tail", args: "[-n N] <archivo>", description: "Muestra las ultimas lineas.", topicNumber: 4, subtopicId: "pipes", categoria: "Leer archivos" },
  { name: "nl", args: "<archivo>", description: "Numera las lineas.", topicNumber: 4, subtopicId: "pipes", categoria: "Leer archivos" },

  // Crear y editar
  { name: "touch", args: "<archivo>", description: "Crea un archivo vacio o actualiza su fecha.", topicNumber: 3, subtopicId: "navegacion", categoria: "Crear y editar" },
  { name: "mkdir", args: "[-p] <nombre>", description: "Crea un directorio.", topicNumber: 3, subtopicId: "navegacion", categoria: "Crear y editar" },
  { name: "nano", args: "<archivo>", description: "Editor de texto sencillo.", topicNumber: 4, subtopicId: "editores", categoria: "Crear y editar" },
  { name: "vi", args: "<archivo>", description: "Editor modal, presente en todo Linux.", topicNumber: 4, subtopicId: "editores", categoria: "Crear y editar" },

  // Copiar, mover y borrar
  { name: "cp", args: "[-r] origen destino", description: "Copia archivos y directorios.", topicNumber: 4, subtopicId: "copiar-borrar", categoria: "Copiar, mover y borrar" },
  { name: "mv", args: "origen destino", description: "Mueve o renombra.", topicNumber: 4, subtopicId: "copiar-borrar", categoria: "Copiar, mover y borrar" },
  { name: "rm", args: "[-r] <ruta>", description: "Borra sin papelera.", topicNumber: 4, subtopicId: "copiar-borrar", categoria: "Copiar, mover y borrar" },
  { name: "rmdir", args: "<directorio>", description: "Borra un directorio vacio.", topicNumber: 3, subtopicId: "operaciones-directorios", categoria: "Copiar, mover y borrar" },

  // Buscar y contar
  { name: "grep", args: "[-r] <patron>", description: "Busca texto dentro de archivos.", topicNumber: 7, subtopicId: "grep", categoria: "Buscar y contar" },
  { name: "find", args: "<ruta> -name <x>", description: "Busca archivos por nombre o atributo.", topicNumber: 7, subtopicId: "find", categoria: "Buscar y contar" },
  { name: "which", args: "<comando>", description: "Dice donde vive un comando.", topicNumber: 7, subtopicId: "which", categoria: "Buscar y contar" },
  { name: "wc", args: "[-l] <archivo>", description: "Cuenta lineas, palabras y caracteres.", topicNumber: 4, subtopicId: "pipes", categoria: "Buscar y contar" },

  // Permisos y cuenta
  { name: "chmod", args: "<modo> <ruta>", description: "Cambia los permisos.", topicNumber: 5, subtopicId: "chmod", categoria: "Permisos y cuenta" },
  { name: "umask", args: "[modo]", description: "Permisos por defecto de lo que crees.", topicNumber: 5, subtopicId: "umask", categoria: "Permisos y cuenta" },
  { name: "whoami", description: "Dice con que cuenta estas.", topicNumber: 8, subtopicId: "usuarios", categoria: "Permisos y cuenta" },
  { name: "id", args: "[usuario]", description: "Muestra usuario y grupos.", topicNumber: 8, subtopicId: "usuarios", categoria: "Permisos y cuenta" },

  // Comprimir y empaquetar
  { name: "tar", args: "[-czf] <archivo>", description: "Empaqueta y desempaqueta.", topicNumber: 6, subtopicId: "tar", categoria: "Comprimir y empaquetar" },
  { name: "gzip", args: "<archivo>", description: "Comprime un archivo.", topicNumber: 6, subtopicId: "comprimir", categoria: "Comprimir y empaquetar" },
  { name: "unzip", args: "<archivo.zip>", description: "Extrae un archivo zip.", topicNumber: 6, subtopicId: "comprimir", categoria: "Comprimir y empaquetar" },

  // Variables del entorno
  { name: "echo", args: "<texto>", description: "Imprime texto o el valor de una variable.", topicNumber: 2, subtopicId: "variables", categoria: "Variables del entorno" },
  { name: "export", args: "<var>", description: "Publica una variable al entorno.", topicNumber: 2, subtopicId: "variables", categoria: "Variables del entorno" },
  { name: "env", description: "Lista las variables de entorno.", topicNumber: 2, subtopicId: "variables", categoria: "Variables del entorno" },
  { name: "unset", args: "<var>", description: "Elimina una variable.", topicNumber: 2, subtopicId: "variables", categoria: "Variables del entorno" },

  // Procesos
  { name: "jobs", description: "Lista los trabajos de esta terminal.", topicNumber: 9, subtopicId: "primer-y-segundo-plano", categoria: "Procesos" },
  { name: "bg", args: "[%n]", description: "Continua un trabajo en segundo plano.", topicNumber: 9, subtopicId: "primer-y-segundo-plano", categoria: "Procesos" },
  { name: "fg", args: "[%n]", description: "Trae un trabajo al primer plano.", topicNumber: 9, subtopicId: "primer-y-segundo-plano", categoria: "Procesos" },

  // Escribir scripts
  { name: "bash", args: "<script.sh>", description: "Ejecuta un script.", topicNumber: 10, subtopicId: "primer-script", categoria: "Escribir scripts" },
  { name: "read", args: "[-p aviso] <var>", description: "Lee una linea de la entrada.", topicNumber: 10, subtopicId: "variables", categoria: "Escribir scripts" },
  { name: "test", args: "<condicion>", description: "Comprueba una condicion; se escribe [ ].", topicNumber: 10, subtopicId: "condicionales", categoria: "Escribir scripts" },
  { name: "exit", args: "[codigo]", description: "Termina el script con un codigo de salida.", topicNumber: 10, subtopicId: "scripting", categoria: "Escribir scripts" },
]

/** How many the cheat sheet shows at once. */
export const CHEAT_SHEET_SIZE = 4

export function findCommand(name: string): EssentialCommand | undefined {
  return COMMANDS.find((c) => c.name === name)
}
