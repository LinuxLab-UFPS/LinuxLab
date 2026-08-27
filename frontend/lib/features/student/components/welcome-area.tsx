import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { LessonBody } from "@shared/components/lesson-body"
import { LessonContainer } from "@shared/components/terminal-ui"
import { CourseRoadmap } from "@/lib/features/student/components/course-roadmap"
import { bienvenida, type PaginaBienvenida } from "@shared/lib/content/bienvenida"
import { syllabus } from "@shared/lib/content/temario"
import type { LessonBlock } from "@shared/lib/content/lesson-blocks"
import type { TopicLessons } from "@shared/lib/content/lessons"

/**
 * La columna de la seccion de bienvenida.
 *
 * No pasa por `ContentArea` ni por `LessonScrollArea`: los dos giran alrededor
 * del numero de tema —para construir rutas de assets y para marcar la leccion
 * como leida— y aqui no hay tema ni progreso que marcar. Leer la portada no es
 * trabajo del curso.
 */
export function WelcomeArea({
  page,
  blocks,
  topicLessons,
}: {
  page: PaginaBienvenida | null
  blocks: LessonBlock[] | null
  topicLessons: Record<number, TopicLessons>
}) {
  const esRoadmap = page?.kind === "roadmap"
  // Adonde sigue el curso: la otra pagina de la seccion o, desde la ultima, el
  // primer tema de verdad.
  const indice = bienvenida.pages.findIndex((p) => p.id === page?.id)
  const siguiente = bienvenida.pages[indice + 1]
  const destino = siguiente
    ? { href: `/curso?tema=${bienvenida.slug}&sub=${siguiente.id}`, label: siguiente.title }
    : { href: `/curso?tema=${syllabus[0].slug}`, label: syllabus[0].title }

  return (
    <div className="min-w-0 flex-1 overflow-y-auto">
      <LessonContainer>
        <header className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            {bienvenida.title}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            {page?.title ?? bienvenida.title}
          </h1>
        </header>

        {esRoadmap ? (
          <CourseRoadmap topicLessons={topicLessons} />
        ) : blocks && blocks.length > 0 ? (
          <LessonBody blocks={blocks} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Esta página todavía no tiene contenido.
          </p>
        )}

        <nav className="mt-12 border-t border-border pt-6">
          <Link
            href={destino.href}
            className="group inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:bg-primary/90"
          >
            {siguiente ? "Continuar" : "Empezar el curso"}
            <span className="opacity-80">· {destino.label}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </nav>
      </LessonContainer>
    </div>
  )
}
