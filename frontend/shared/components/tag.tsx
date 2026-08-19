import type { LucideIcon } from "lucide-react"
import { cn } from "@shared/lib/utils"

/**
 * La etiqueta pequeña de las tarjetas: dificultad, tema, "1 video",
 * "1 simulador", el estado de una actividad de curso.
 *
 * Existia cuatro veces por separado —un `Pill` y un `Tag` locales, la constante
 * `PILL` repetida en tres archivos y un renderizador en linea en las tarjetas de
 * modulo— y con dos formas distintas: unas con borde y fondo transparente, otras
 * con fondo tenido. Eran la misma cosa dibujada de dos maneras, asi que aqui hay
 * una sola: fondo tenido, sin borde.
 *
 * El color es la senal, no la decoracion, y de ahi sale que queden tan pocos.
 * Solo dos cosas siguen teniendo color propio: la dificultad, porque avisa
 * (verde facil, ambar intermedio, rosa dificil), y el estado de una actividad,
 * porque dice si esta hecha. Todo lo demas que llevaba color —cuantos videos,
 * cuantos simuladores, cuantas actividades, la calificacion— eran datos
 * pintados de colores distintos sin que el color quisiera decir nada: van en
 * `primary`, el rojo de la marca, y lo que ya era un dato neutro sigue gris.
 */
export type TagTone =
  | "primary"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "neutral"
  | "muted"

const TONE: Record<TagTone, string> = {
  /** El rojo de la marca: el tono por defecto de lo que lleva color. */
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  /** Sobre la tarjeta: se apoya en el color del texto, no en uno propio. */
  neutral: "bg-foreground/5 text-muted-foreground",
  /** Sobre fondos ya tenidos, donde `foreground/5` no llega a verse. */
  muted: "bg-secondary text-muted-foreground",
}

export const TAG_BASE =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"

export function Tag({
  icon: Icon,
  tone = "neutral",
  className,
  children,
}: {
  icon?: LucideIcon
  tone?: TagTone
  className?: string
  children: React.ReactNode
}) {
  return (
    <span className={cn(TAG_BASE, TONE[tone], className)}>
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      {children}
    </span>
  )
}
