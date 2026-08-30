import Link from "next/link"
import type { ComponentType } from "react"
import type { LucideIcon } from "lucide-react"
import { NeonProgress } from "@shared/components/neon-progress"
import { cn } from "@shared/lib/utils"
import { Tag, type TagTone } from "@shared/components/tag"

export interface CardTag {
  icon: LucideIcon
  label: string
  tone?: TagTone
}

/* El hover: tinte del titulo, degradado del subrayado y halo de la tarjeta.
   Habia un segundo juego en verde para los simuladores, pero una tarjeta de
   simulador y una de tema son la misma pieza haciendo lo mismo, y verlas de dos
   colores solo decia que venian de dos sitios. Ahora las dos van al rojo de la
   marca. */
const HOVER_TITLE = "group-hover:text-primary"
const HOVER_UNDERLINE = "from-[#ff5470] to-[#C41E3A]"
const HOVER_CARD = "hover:border-primary/50 hover:shadow-[var(--neon-glow-strong)]"

/**
 * The AlgoMaster-style card, reused by the topic grid and the simulators grid.
 * The illustration zooms and the whole card lifts and glows on hover while the
 * text stays put. Progress bar and tags are optional.
 */
export function ContentCard({
  href,
  title,
  description,
  illustration: Illustration,
  tags = [],
  progress,
}: {
  href: string
  title: string
  description?: string
  illustration: ComponentType
  tags?: CardTag[]
  progress?: number
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 ease-out hover:z-10 hover:scale-[1.02]",
        HOVER_CARD,
      )}
    >
      {/* El panel del dibujo: oscuro en los dos temas (ver --ilus-panel en
          globals.css), asi que en oscuro es el mismo color que el fondo de la
          pagina y en claro es el bloque que parte la tarjeta en dos. El dibujo
          se acerca al pasar el raton. */}
      <div className="overflow-hidden border-b border-border bg-ilus-panel">
        <div className="flex aspect-[16/10] items-center justify-center p-6 transition-transform duration-500 ease-out group-hover:scale-110">
          <Illustration />
        </div>
      </div>

      {/* Content stays steady while the card and image grow. */}
      <div className="flex flex-1 flex-col p-4">
        <h3
          className={cn(
            "text-base font-bold tracking-tight text-foreground transition-colors",
            HOVER_TITLE,
          )}
        >
          {title}
        </h3>
        <span
          className={cn(
            "mt-1.5 h-0.5 w-0 rounded-full bg-gradient-to-r transition-all duration-300 ease-out group-hover:w-12",
            HOVER_UNDERLINE,
          )}
        />
        {/* Dos lineas exactas y ni una mas: con la descripcion suelta, cada
            tarjeta media distinto y las filas quedaban desniveladas. Recortar
            aqui es lo que hace que todas las de una fila midan igual. */}
        {description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Tag key={tag.label} icon={tag.icon} tone={tag.tone}>
                {tag.label}
              </Tag>
            ))}
          </div>
        )}

        {progress !== undefined && (
          <div className="mt-auto pt-4">
            <div className="flex items-center gap-2">
              <NeonProgress value={progress} />
              <span className="w-9 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                {progress}%
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
