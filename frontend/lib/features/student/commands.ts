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
 */
export interface EssentialCommand {
  name: string
  args?: string
  description: string
  topicNumber: number
  subtopicId: string
}

export const COMMANDS: EssentialCommand[] = [
  // 2 · La Terminal
  { name: "ls", args: "[-la]", description: "Lista el contenido de un directorio.", topicNumber: 2, subtopicId: "anatomia-comando" },
  { name: "echo", args: "<texto>", description: "Imprime texto o el valor de una variable.", topicNumber: 2, subtopicId: "variables" },
  { name: "export", args: "<var>", description: "Publica una variable al entorno.", topicNumber: 2, subtopicId: "variables" },
  { name: "env", description: "Lista las variables de entorno.", topicNumber: 2, subtopicId: "variables" },
  { name: "unset", args: "<var>", description: "Elimina una variable.", topicNumber: 2, subtopicId: "variables" },

  // 3 · Directorios
  { name: "pwd", description: "Imprime el directorio actual.", topicNumber: 3, subtopicId: "filesystem" },
  { name: "cd", args: "<ruta>", description: "Cambia de directorio.", topicNumber: 3, subtopicId: "filesystem" },
  { name: "mkdir", args: "[-p] <nombre>", description: "Crea un directorio.", topicNumber: 3, subtopicId: "navegacion" },
  { name: "touch", args: "<archivo>", description: "Crea un archivo vacío o actualiza su fecha.", topicNumber: 3, subtopicId: "navegacion" },
  { name: "tree", args: "[ruta]", description: "Muestra la estructura en forma de árbol.", topicNumber: 3, subtopicId: "navegacion" },
  { name: "cp", args: "[-r] origen destino", description: "Copia archivos y directorios.", topicNumber: 3, subtopicId: "copiar-borrar" },
  { name: "mv", args: "origen destino", description: "Mueve o renombra.", topicNumber: 3, subtopicId: "copiar-borrar" },
  { name: "rm", args: "[-r] <ruta>", description: "Borra sin papelera.", topicNumber: 3, subtopicId: "copiar-borrar" },
  { name: "rmdir", args: "<directorio>", description: "Borra un directorio vacío.", topicNumber: 3, subtopicId: "copiar-borrar" },

  // 4 · Manejo de Archivos
  { name: "cat", args: "<archivo>", description: "Muestra el contenido de un archivo.", topicNumber: 4, subtopicId: "touch" },
  { name: "head", args: "[-n N] <archivo>", description: "Muestra las primeras líneas.", topicNumber: 4, subtopicId: "pipes" },
  { name: "tail", args: "[-n N] <archivo>", description: "Muestra las últimas líneas.", topicNumber: 4, subtopicId: "pipes" },
  { name: "wc", args: "[-l] <archivo>", description: "Cuenta líneas, palabras y caracteres.", topicNumber: 4, subtopicId: "pipes" },
  { name: "nl", args: "<archivo>", description: "Numera las líneas.", topicNumber: 4, subtopicId: "pipes" },
  { name: "nano", args: "<archivo>", description: "Editor de texto sencillo.", topicNumber: 4, subtopicId: "editores" },
  { name: "vi", args: "<archivo>", description: "Editor modal, presente en todo Linux.", topicNumber: 4, subtopicId: "editores" },

  // 5 · Permisos
  { name: "chmod", args: "<modo> <ruta>", description: "Cambia los permisos.", topicNumber: 5, subtopicId: "chmod" },
  { name: "chown", args: "<dueño> <ruta>", description: "Cambia el propietario.", topicNumber: 5, subtopicId: "chown" },
  { name: "umask", args: "[modo]", description: "Permisos por defecto de lo que crees.", topicNumber: 5, subtopicId: "umask" },

  // 6 · Compresión
  { name: "tar", args: "[-czf] <archivo>", description: "Empaqueta y desempaqueta.", topicNumber: 6, subtopicId: "tar" },
  { name: "gzip", args: "<archivo>", description: "Comprime un archivo.", topicNumber: 6, subtopicId: "gzip" },
  { name: "unzip", args: "<archivo.zip>", description: "Extrae un archivo zip.", topicNumber: 6, subtopicId: "zip" },

  // 7 · Búsqueda
  { name: "find", args: "<ruta> -name <x>", description: "Busca archivos por nombre o atributo.", topicNumber: 7, subtopicId: "find" },
  { name: "grep", args: "[-r] <patrón>", description: "Busca texto dentro de archivos.", topicNumber: 7, subtopicId: "grep" },
  { name: "which", args: "<comando>", description: "Dice dónde vive un comando.", topicNumber: 7, subtopicId: "which" },

  // 8 · Usuarios y grupos
  { name: "whoami", description: "Dice con qué cuenta estás.", topicNumber: 8, subtopicId: "usuarios" },
  { name: "id", args: "[usuario]", description: "Muestra usuario y grupos.", topicNumber: 8, subtopicId: "usuarios" },
  { name: "passwd", description: "Cambia la contraseña.", topicNumber: 8, subtopicId: "usuarios" },
  { name: "sudo", args: "<comando>", description: "Ejecuta como otro usuario.", topicNumber: 8, subtopicId: "grupos" },

  // 9 · Gestión de procesos
  { name: "ps", args: "[aux]", description: "Lista procesos.", topicNumber: 9, subtopicId: "procesos" },
  { name: "top", description: "Procesos en vivo, ordenados por consumo.", topicNumber: 9, subtopicId: "procesos" },
  { name: "kill", args: "<pid>", description: "Termina un proceso.", topicNumber: 9, subtopicId: "procesos" },

  // 10 · Servicios y demonios
  { name: "systemctl", args: "<acción> <servicio>", description: "Controla servicios del sistema.", topicNumber: 10, subtopicId: "servicios" },

  // 11 · Shell scripting
  { name: "bash", args: "<script.sh>", description: "Ejecuta un script.", topicNumber: 11, subtopicId: "scripting" },
  { name: "read", args: "<var>", description: "Lee una línea de la entrada.", topicNumber: 11, subtopicId: "scripting" },

  // 12 · Instalación de paquetes
  { name: "apt", args: "install <paquete>", description: "Instala paquetes en Debian y Ubuntu.", topicNumber: 12, subtopicId: "apt" },
  { name: "dpkg", args: "-i <paquete.deb>", description: "Instala un paquete descargado.", topicNumber: 12, subtopicId: "dpkg" },
]

/** How many the cheat sheet shows at once. */
export const CHEAT_SHEET_SIZE = 4

export function findCommand(name: string): EssentialCommand | undefined {
  return COMMANDS.find((c) => c.name === name)
}
