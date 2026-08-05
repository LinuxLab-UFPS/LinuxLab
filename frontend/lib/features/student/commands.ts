/**
 * The commands the cheat sheet can offer, each tied to the lesson that teaches
 * it for the first time. A command only becomes available once that lesson is
 * read, so the panel never shows something the student has not seen yet.
 *
 * `topicNumber`/`subtopicId` match the lesson keys used by the progress store.
 */
export interface EssentialCommand {
  name: string
  args?: string
  description: string
  topicNumber: number
  subtopicId: string
}

export const COMMANDS: EssentialCommand[] = [
  {
    name: "ls",
    args: "[-la]",
    description: "Lista el contenido de un directorio.",
    topicNumber: 2,
    subtopicId: "anatomia-comando",
  },
  {
    name: "echo",
    args: "<texto>",
    description: "Imprime texto o el valor de una variable.",
    topicNumber: 2,
    subtopicId: "variables",
  },
  {
    name: "export",
    args: "<var>",
    description: "Publica una variable al entorno.",
    topicNumber: 2,
    subtopicId: "variables",
  },
  {
    name: "pwd",
    description: "Imprime el directorio actual.",
    topicNumber: 3,
    subtopicId: "filesystem",
  },
  {
    name: "cd",
    args: "<ruta>",
    description: "Cambia de directorio.",
    topicNumber: 3,
    subtopicId: "filesystem",
  },
  {
    name: "mkdir",
    args: "[-p] <nombre>",
    description: "Crea un directorio.",
    topicNumber: 3,
    subtopicId: "navegacion",
  },
  {
    name: "touch",
    args: "<archivo>",
    description: "Crea un archivo vacío o actualiza su fecha.",
    topicNumber: 3,
    subtopicId: "navegacion",
  },
  {
    name: "tree",
    args: "[ruta]",
    description: "Muestra la estructura en forma de árbol.",
    topicNumber: 3,
    subtopicId: "navegacion",
  },
  {
    name: "cp",
    args: "[-r] origen destino",
    description: "Copia archivos y directorios.",
    topicNumber: 3,
    subtopicId: "copiar-borrar",
  },
  {
    name: "mv",
    args: "origen destino",
    description: "Mueve o renombra.",
    topicNumber: 3,
    subtopicId: "copiar-borrar",
  },
  {
    name: "rm",
    args: "[-r] <ruta>",
    description: "Borra sin papelera.",
    topicNumber: 3,
    subtopicId: "copiar-borrar",
  },
  {
    name: "rmdir",
    args: "<directorio>",
    description: "Borra un directorio vacío.",
    topicNumber: 3,
    subtopicId: "copiar-borrar",
  },
  {
    name: "cat",
    args: "<archivo>",
    description: "Muestra el contenido de un archivo.",
    topicNumber: 4,
    subtopicId: "touch",
  },
]

/** How many the cheat sheet shows at once. */
export const CHEAT_SHEET_SIZE = 4

export function findCommand(name: string): EssentialCommand | undefined {
  return COMMANDS.find((c) => c.name === name)
}
