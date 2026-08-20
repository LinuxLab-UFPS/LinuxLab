/**
 * GENERADO por scripts/gen-syllabus.mjs — NO editar a mano.
 *
 * El catalogo del temario del curso (RF-01): los docentes habilitan temas
 * por curso pero nunca editan esta lista. La fuente unica de estructura es
 * `content/temario/tema-NN/meta.json`; el contenido de lecciones vive en los
 * .md de esa misma carpeta.
 */
import type { Topic } from "@/lib/features/student/types"

export const syllabus: Topic[] = [
  {
    number: 1,
    slug: "introduccion-a-linux",
    title: "Introducción a Linux",
    description: "Historia, arquitectura y fundamentos del sistema operativo Linux",
    subTopics: [
      { number: 1, title: "Linux: Dónde todo empezó" },
      { number: 2, title: "El Kernel" },
      { number: 3, title: "Entorno de ventanas" },
      { number: 4, title: "Instalación" },
    ],
  },
  {
    number: 2,
    slug: "la-terminal",
    title: "La Terminal",
    description: "La línea de comandos, el shell Bash y los comandos esenciales para moverte por el sistema",
    subTopics: [
      { number: 1, title: "La línea de comandos" },
      { number: 2, title: "Anatomía de un comando" },
      { number: 3, title: "Variables en Bash" },
    ],
  },
  {
    number: 3,
    slug: "directorios",
    title: "Directorios",
    description: "El sistema de archivos de Linux, su estructura jerárquica, la navegación entre directorios y las operaciones que los crean, clonan y eliminan",
    subTopics: [
      { number: 1, title: "El sistema de archivos" },
      { number: 2, title: "Navegación esencial" },
      { number: 3, title: "Operaciones con directorios" },
      { number: 4, title: "Práctica: crea tu estructura" },
    ],
  },
  {
    number: 4,
    slug: "manejo-de-archivos",
    title: "Manejo de Archivos",
    description: "Crear archivos, copiarlos, moverlos y borrarlos, seleccionarlos con comodines, encadenar comandos con pipes y editarlos con vi",
    subTopics: [
      { number: 1, title: "Crear archivos" },
      { number: 2, title: "Copiar, mover y borrar" },
      { number: 3, title: "Comodines" },
      { number: 4, title: "Encadenar comandos" },
      { number: 5, title: "Editores de texto" },
    ],
  },
  {
    number: 5,
    slug: "permisos",
    title: "Permisos",
    description: "Leer los permisos de un archivo, cambiarlos con chmod y entender qué significan sobre un directorio",
    subTopics: [
      { number: 1, title: "Dueño, grupo y permisos" },
      { number: 2, title: "Notación octal" },
      { number: 3, title: "Cambiar permisos con chmod" },
      { number: 4, title: "Permisos sobre directorios" },
      { number: 5, title: "Permisos por defecto" },
    ],
  },
  {
    number: 6,
    slug: "compresion",
    title: "Compresión",
    description: "Reducir el tamaño de un archivo con gzip y bzip2, y empaquetar carpetas enteras con tar",
    subTopics: [
      { number: 1, title: "Comprimir y descomprimir" },
      { number: 2, title: "Empaquetar con tar" },
    ],
  },
  {
    number: 7,
    slug: "busqueda",
    title: "Búsqueda",
    description: "Las dos búsquedas del día a día: grep dentro de los archivos y find entre ellos, con expresiones regulares para afinar el patrón",
    subTopics: [
      { number: 1, title: "Buscar dentro de los archivos" },
      { number: 2, title: "Expresiones regulares" },
      { number: 3, title: "Buscar archivos con find" },
      { number: 4, title: "Ordenar los resultados" },
    ],
  },
  {
    number: 8,
    slug: "usuarios-y-grupos",
    title: "Usuarios y grupos",
    description: "Quién es uno para el sistema, dónde guarda esa información y cómo se administran las cuentas y los grupos",
    subTopics: [
      { number: 1, title: "Quién es uno para el sistema" },
      { number: 2, title: "Dónde se guarda esa información" },
      { number: 3, title: "Administrar cuentas y grupos" },
      { number: 4, title: "Compartir archivos con un grupo" },
    ],
  },
  {
    number: 9,
    slug: "gestion-de-procesos",
    title: "Gestión de procesos",
    description: "Ver qué procesos se están ejecutando, cómo ponerlos en primer o segundo plano, cómo terminarlos y qué son los daemons",
    subTopics: [
      { number: 1, title: "Ver los procesos" },
      { number: 2, title: "Primer plano y segundo plano" },
      { number: 3, title: "Señales y kill" },
      { number: 4, title: "Daemons y servicios" },
    ],
  },
  {
    number: 10,
    slug: "shell-scripting",
    title: "Shell scripting",
    description: "Variables, condicionales, ciclos y funciones en Bash.",
    subTopics: [],
  },
]

/** Lookup a topic by its number. */
export function getTopic(number: number): Topic | undefined {
  return syllabus.find((t) => t.number === number)
}

/** Lookup a topic by its slug. */
export function getTopicBySlug(slug: string): Topic | undefined {
  return syllabus.find((t) => t.slug === slug)
}
