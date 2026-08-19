import type { Topic } from "@/lib/features/student/types"

/**
 * THE canonical syllabus for the Operating Systems course.
 *
 * This is fixed content (RF-01): teachers enable/disable topics per course but
 * never edit this list. It is the single source of truth: every screen that
 * shows topics imports from here. Titles and subtopics are authoritative;
 * descriptions are short navigational summaries, NOT lesson content. The actual
 * teaching material (text, video, links per topic) lives in `content/temario/`
 * and is authored by the thesis team.
 *
 * 12 topics.
 */
export const syllabus: Topic[] = [
  {
    number: 1,
    slug: "introduccion-a-linux",
    title: "Introducción a Linux",
    description: "Historia, kernel, entorno de ventanas e instalación.",
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
    description:
      "La línea de comandos, una introducción al shell Bash y los comandos esenciales para moverte por el sistema.",
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
    description:
      "Tipos de directorios, la jerarquía del sistema, navegación y operaciones con directorios.",
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
    description:
      "Crear, copiar, mover y borrar archivos, seleccionarlos con comodines, encadenar comandos con pipes y los editores de texto.",
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
    description:
      "Dueño, grupo y permisos de archivos y directorios, notación octal, chmod y umask.",
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
    description: "Compresión de archivos con tar, gzip, bzip2 y zip.",
    subTopics: [
      { number: 1, title: "Comprimir y descomprimir" },
      { number: 2, title: "Empaquetar con tar" },
    ],
  },
  {
    number: 7,
    slug: "busqueda",
    title: "Búsqueda",
    description:
      "Buscar texto dentro de los archivos con grep, localizar archivos con find y ordenar los resultados.",
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
    description: "passwd, shadow y creación de cuentas con useradd y groupadd.",
    subTopics: [
      { number: 1, title: "passwd" },
      { number: 2, title: "shadow" },
      { number: 3, title: "useradd, groupadd" },
    ],
  },
  {
    number: 9,
    slug: "gestion-de-procesos",
    title: "Gestión de procesos",
    description: "ps, top, kill, jobs y manejo de primer y segundo plano (fg, bg, &).",
    subTopics: [
      { number: 1, title: "ps, top" },
      { number: 2, title: "kill, jobs" },
      { number: 3, title: "Primer plano y segundo plano (fg, bg, &)" },
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
