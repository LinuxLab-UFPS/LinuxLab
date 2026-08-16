"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { useTerminalUI } from "@shared/components/terminal-ui"

/**
 * La cabecera de una leccion: donde estas y como se llama esto.
 *
 * Antes el contenido empezaba directamente con un `##` del markdown, sin titulo
 * ni contexto, y pegado al borde superior. Se lee mejor con un respiro arriba,
 * la ruta que te trajo y el nombre de la leccion antes del cuerpo.
 *
 * El titulo encoge con la terminal abierta. `COMPACT_PROSE` no sirve aqui:
 * solo alcanza a lo que vive dentro de `.lesson-prose`, y esto va fuera.
 */
export function LessonHeader({
  topicTitle,
  topicSlug,
  lessonTitle,
}: {
  topicTitle: string
  topicSlug: string
  lessonTitle: string
}) {
  const { open } = useTerminalUI()

  return (
    <header className="mb-6">
      <nav
        aria-label="Ruta"
        className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
      >
        <Link href="/home" className="transition-colors hover:text-foreground">
          LinuxLab
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
        <Link
          href={`/group?tema=${topicSlug}`}
          className="transition-colors hover:text-foreground"
        >
          {topicTitle}
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
        {/* El ultimo escalon es donde ya estas: no se enlaza a si mismo. */}
        <span className="text-foreground">{lessonTitle}</span>
      </nav>

      <h1
        className={cn(
          "mt-3 font-bold tracking-tight text-foreground",
          open ? "text-2xl" : "text-3xl",
        )}
      >
        {lessonTitle}
      </h1>

      <hr className="mt-5 border-border" />
    </header>
  )
}
