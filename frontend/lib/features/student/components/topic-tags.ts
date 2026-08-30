import { Clock, Video, Terminal, ListChecks } from "lucide-react"
import type { CardTag } from "@/lib/features/student/components/content-card"
import type { TopicPreview } from "@shared/lib/content/lessons"

/** Lo que el tema trae dentro, en una sola fila. El orden lo fija lo que el
 *  estudiante decide con ello: primero cuanto cuesta leerlo, y detras lo que hay
 *  para hacer —actividades, simuladores— y por ultimo lo que hay para ver.
 *
 *  Los tres del mismo rojo. Antes cada uno tenia su color —azul los videos,
 *  verde los simuladores, ambar las actividades— y no significaban nada: son
 *  cuentas del mismo tema, y el icono ya dice de que es cada una. El tiempo se
 *  queda gris porque no es contenido, es una medida.
 *
 *  Vive aparte de `topic-grid.tsx` porque la portada publica tambien lo usa, y
 *  esa reja no puede depender de un modulo de cliente: la del panel lee el
 *  progreso de la sesion y la publica no tiene sesion que leer. */
export function previewTags(preview: TopicPreview): CardTag[] {
  const tags: CardTag[] = []
  if (preview.minutes > 0) {
    tags.push({
      icon: Clock,
      label: `${preview.minutes} min`,
      tone: "muted" as const,
    })
  }
  if (preview.activities > 0) {
    tags.push({
      icon: ListChecks,
      label: `${preview.activities} ${preview.activities === 1 ? "actividad" : "actividades"}`,
      tone: "primary" as const,
    })
  }
  if (preview.simulators > 0) {
    tags.push({
      icon: Terminal,
      label: `${preview.simulators} ${preview.simulators === 1 ? "simulador" : "simuladores"}`,
      tone: "primary" as const,
    })
  }
  if (preview.videos > 0) {
    tags.push({
      icon: Video,
      label: `${preview.videos} ${preview.videos === 1 ? "video" : "videos"}`,
      tone: "primary" as const,
    })
  }
  return tags
}
