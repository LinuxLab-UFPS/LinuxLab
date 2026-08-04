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
      { number: 1, title: "¿Qué es Linux? Dónde todo empezó" },
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
      "Tipos de directorios, la jerarquía del sistema, navegación esencial y cómo copiar, mover y borrar.",
    subTopics: [
      { number: 1, title: "El sistema de archivos" },
      { number: 2, title: "Navegación esencial" },
      { number: 3, title: "Copiar, mover y borrar" },
      { number: 4, title: "Práctica: crea tu estructura" },
    ],
  },
  {
    number: 4,
    slug: "creacion-de-archivos",
    title: "Creación de archivos",
    description: "Crear archivos con touch y redirección, y editores de texto: vi, pico, nano.",
    subTopics: [
      { number: 1, title: "Crear archivos" },
      { number: 2, title: "Práctica: construye una universidad" },
      { number: 3, title: "Editores: vi, pico, nano" },
    ],
  },
  {
    number: 5,
    slug: "permisos",
    title: "Permisos",
    description: "Gestión de permisos con chmod, chown y umask.",
    subTopics: [
      { number: 1, title: "chmod" },
      { number: 2, title: "chown" },
      { number: 3, title: "umask" },
    ],
  },
  {
    number: 6,
    slug: "compresion",
    title: "Compresión",
    description: "Compresión de archivos con tar, gzip, bzip2 y zip.",
    subTopics: [],
  },
  {
    number: 7,
    slug: "busqueda",
    title: "Búsqueda",
    description: "Patrones, expresiones regulares y uso de find y grep.",
    subTopics: [
      { number: 1, title: "Patrones" },
      { number: 2, title: "Expresiones regulares" },
      { number: 3, title: "find, grep" },
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
    slug: "servicios-y-demonios",
    title: "Servicios y demonios",
    description: "systemctl y estados de los servicios.",
    subTopics: [
      { number: 1, title: "systemctl" },
      { number: 2, title: "Estados de servicios" },
    ],
  },
  {
    number: 11,
    slug: "shell-scripting",
    title: "Shell scripting",
    description: "Variables, condicionales, ciclos y funciones en Bash.",
    subTopics: [],
  },
  {
    number: 12,
    slug: "instalacion-de-paquetes",
    title: "Instalación de paquetes",
    description: "Gestión de paquetes con apt y dnf.",
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
