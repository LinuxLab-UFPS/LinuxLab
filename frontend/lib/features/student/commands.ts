/**
 * Los comandos esenciales del curso, los que el estudiante tiene a mano debajo
 * de la terminal. Lista curada a propósito: no es el temario completo, son los
 * que se usan casi todos los días en el laboratorio.
 */
export interface EssentialCommand {
  name: string
  args?: string
  description: string
}

export const COMMANDS: EssentialCommand[] = [
  { name: "ls", args: "[-la]", description: "Lista el contenido de un directorio." },
  { name: "cd", args: "<ruta>", description: "Cambia de directorio." },
  { name: "pwd", description: "Imprime el directorio actual." },
  { name: "mkdir", args: "[-p] <nombre>", description: "Crea un directorio." },
  { name: "touch", args: "<archivo>", description: "Crea un archivo vacío o actualiza su fecha." },
  { name: "cat", args: "<archivo>", description: "Muestra el contenido de un archivo." },
  { name: "cp", args: "[-r] origen destino", description: "Copia archivos y directorios." },
  { name: "mv", args: "origen destino", description: "Mueve o renombra." },
  { name: "rm", args: "[-r] <ruta>", description: "Borra sin papelera." },
  { name: "echo", args: "<texto>", description: "Imprime texto o el valor de una variable." },
  { name: "vi", args: "<archivo>", description: "Editor modal, presente en todo Linux." },
  { name: "find", args: "<ruta> -name <x>", description: "Busca archivos por nombre o atributo." },
]

/** How many the cheat sheet shows at once. */
export const CHEAT_SHEET_SIZE = 4

export function findCommand(name: string): EssentialCommand | undefined {
  return COMMANDS.find((c) => c.name === name)
}
