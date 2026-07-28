import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import type { LessonRef } from "@/lib/features/shared/lessons"

function describe(ref: LessonRef, currentTopicNumber: number, direction: "prev" | "next") {
  const crossesTopic = ref.topicNumber !== currentTopicNumber
  return {
    kicker: crossesTopic
      ? direction === "next"
        ? "Siguiente tema"
        : "Tema anterior"
      : direction === "next"
        ? "Siguiente"
        : "Anterior",
    title: crossesTopic
      ? `${ref.topicNumber}. ${ref.topicTitle}`
      : (ref.subtopicTitle ?? ref.topicTitle),
  }
}

/**
 * Previous/next navigation at the end of a lesson. Advances through subtopics and
 * then rolls over into the next topic of the temario.
 */
export function LessonNav({
  currentTopicNumber,
  prev,
  next,
}: {
  currentTopicNumber: number
  prev: LessonRef | null
  next: LessonRef | null
}) {
  if (!prev && !next) return null

  const prevInfo = prev ? describe(prev, currentTopicNumber, "prev") : null
  const nextInfo = next ? describe(next, currentTopicNumber, "next") : null

  return (
    <nav className="mt-10 flex items-center justify-between gap-4">
      {prev && prevInfo ? (
        <Link
          href={prev.href}
          className="group flex items-center gap-3 max-w-[45%] rounded-md border border-border px-4 py-3 text-left hover:border-primary/40 hover:bg-secondary/40 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">{prevInfo.kicker}</span>
            <span className="block text-sm font-medium text-foreground truncate">
              {prevInfo.title}
            </span>
          </span>
        </Link>
      ) : (
        <span />
      )}

      {next && nextInfo ? (
        <Link
          href={next.href}
          className={`group flex items-center gap-3 max-w-[55%] rounded-md px-5 py-3 text-right transition-all duration-300 ${
            next.isSimulator
              ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_18px_rgba(52,211,153,0.45)] hover:shadow-[0_0_28px_rgba(52,211,153,0.7)]"
              : "bg-primary text-primary-foreground neon-glow hover:neon-glow-strong hover:bg-primary/90"
          }`}
        >
          <span className="min-w-0">
            <span className="block text-xs text-primary-foreground/80">{nextInfo.kicker}</span>
            <span className="block text-sm font-semibold truncate">{nextInfo.title}</span>
          </span>
          <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
