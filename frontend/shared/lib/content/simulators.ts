import { syllabus } from "./temario"

/**
 * Simulators registry. Simulators used to be course subtopics; now they live
 * here, decoupled from the syllabus content. Each one relates to a topic (for
 * its tag) and opens fullscreen at `/simulators/[id]`.
 */
export interface Simulator {
  id: string
  title: string
  description: string
  topicNumber: number
  topicSlug: string
  topicTitle: string
  /** Public path of the self-contained HTML. */
  src: string
  /** Fullscreen route that plays it. */
  href: string
}

const RAW = [
  {
    id: "travesia-del-arbol",
    title: "Travesía del Árbol",
    description:
      "Navega el árbol de directorios de Linux con cd y ls. Llega al directorio objetivo con retos y modos de juego.",
    topicNumber: 3,
    file: "simulador-filesystem.html",
  },
  {
    id: "retos-de-vi",
    title: "Retos de vi",
    description:
      "Cinco retos contrarreloj con los comandos de vi: copia líneas, pégalas donde toca y borra lo que sobra.",
    topicNumber: 4,
    file: "simulador-vi.html",
  },
  {
    id: "filtro-de-permisos",
    title: "Filtro de permisos",
    description:
      "Llegan archivos con los permisos que traen y los que necesitan. Arréglalos con chmod y ajusta la umask para los que están por crear.",
    topicNumber: 5,
    file: "simulador-permisos.html",
  },
]

export const simulators: Simulator[] = RAW.map((s) => {
  const topic = syllabus.find((t) => t.number === s.topicNumber)
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    topicNumber: s.topicNumber,
    topicSlug: topic?.slug ?? "",
    topicTitle: topic?.title ?? "",
    src: `/temario/tema-${String(s.topicNumber).padStart(2, "0")}/${s.file}`,
    href: `/simulators/${s.id}`,
  }
})

export function getSimulators(): Simulator[] {
  return simulators
}

export function getSimulator(id: string): Simulator | undefined {
  return simulators.find((s) => s.id === id)
}
