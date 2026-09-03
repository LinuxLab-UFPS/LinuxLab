import Link from "next/link"
import { BookOpen, Target } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { DIFFICULTY_LABEL, DIFFICULTY_TONE } from "@shared/lib/content/activities"
import { Tag, type TagTone } from "@shared/components/tag"
import type { Difficulty } from "@/lib/models/activities"

/** La nota se colorea por tramos: aprobada holgada, justa o insuficiente. */
export function tonoDeNota(nota: number): TagTone {
  if (nota >= 80) return "emerald"
  if (nota >= 60) return "amber"
  return "rose"
}

const GLOW =
  "hover:border-primary/50 hover:shadow-[var(--neon-glow-strong)]"

/**
 * Una actividad, donde se ofrezca: el catálogo, el panel de la terminal o una
 * lección que la anuncia. Tarjeta ÚNICA para las del temario y las que publica
 * el docente: mismo tamaño de letra y mismos badges en el mismo orden, para que
 * en una misma grid no se noten dos diseños.
 *
 * Los badges cuentan la actividad en dos frases. Bajo el título, el estado:
 * cómo va la calificación (la nota con su color, o "Pendiente" mientras no
 * haya) y la dificultad. Al pie, de qué se trata: el tipo (taller o quiz) y el
 * tema. Nunca se enlaza al curso: las actividades se resuelven junto a la
 * terminal, y ahí lleva el `href`.
 */
export function ActivityCard({
  title,
  description,
  href,
  estado,
  dificultad,
  tipo = "taller",
  topicTitle,
  compact = false,
}: {
  title: string
  description: string
  href: string
  /** La calificación, o null mientras no haya (badge "Pendiente"). */
  estado: { score: number | null; maxScore: number }
  /** Solo las que la declaran la traen; las del docente van sin ella. */
  dificultad?: Difficulty
  /** Taller por defecto: las del temario y las prácticas del docente. */
  tipo?: "taller" | "quiz"
  topicTitle: string
  /** La misma tarjeta con la descripción recortada, para la columna angosta
      junto a la terminal. */
  compact?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-2xl border border-border bg-card transition-all duration-300 ease-out hover:z-10 hover:scale-[1.02]",
        GLOW,
        compact ? "p-4" : "p-5",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
            compact ? "h-8 w-8" : "h-10 w-10",
          )}
        >
          <Target className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </span>

        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "line-clamp-1 font-bold tracking-tight text-foreground transition-colors group-hover:text-primary",
              compact ? "text-sm" : "text-base",
            )}
          >
            {title}
          </h3>
          {/* Estado primero (qué valdría hoy) y después la dificultad (de qué
              tamaño es el reto). Cuando no hay nota todavía, "Pendiente". */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {estado.score !== null ? (
              <Tag tone={tonoDeNota(estado.score)}>
                {estado.score}/{estado.maxScore}
              </Tag>
            ) : (
              <Tag tone="neutral">Pendiente</Tag>
            )}
            {dificultad && (
              <Tag tone={DIFFICULTY_TONE[dificultad]}>
                {DIFFICULTY_LABEL[dificultad]}
              </Tag>
            )}
          </div>
        </div>
      </div>

      <p
        className={cn(
          "mt-3 line-clamp-2 leading-relaxed text-muted-foreground",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {description}
      </p>

      {/* Al pie lo que sitúa la actividad: el tipo y el tema. */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Tag tone="neutral">{tipo === "quiz" ? "Quiz" : "Taller"}</Tag>
        <Tag icon={BookOpen}>{topicTitle}</Tag>
      </div>
    </Link>
  )
}
