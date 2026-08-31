import { LessonBody } from "@shared/components/lesson-body"
import { LessonNav } from "@shared/components/lesson-nav"
import { LessonHeader } from "@shared/components/lesson-header"
import { LessonContainer } from "@shared/components/terminal-ui"
import { LessonScrollArea } from "@shared/components/lesson-scroll-area"
import { CourseRoadmap } from "@/lib/features/student/components/course-roadmap"
import { bienvenida, type PaginaBienvenida } from "@shared/lib/content/bienvenida"
import { syllabus } from "@shared/lib/content/temario"
import type { LessonBlock } from "@shared/lib/content/lesson-blocks"
import type { LessonRef, TopicLessons } from "@shared/lib/content/lessons"

/** Una pagina de la guia como paso de navegacion, igual que una leccion. */
function comoLeccion(p: PaginaBienvenida): LessonRef {
  return {
    topicNumber: 0,
    topicSlug: bienvenida.slug,
    topicTitle: bienvenida.title,
    subtopicId: p.id,
    subtopicTitle: p.title,
    href: `/curso?tema=${bienvenida.slug}&sub=${p.id}`,
  }
}

/** El primer tema del curso, adonde sigue el camino al salir de la guia. */
function primerTema(): LessonRef {
  const t = syllabus[0]
  return {
    topicNumber: t.number,
    topicSlug: t.slug,
    topicTitle: t.title,
    subtopicId: null,
    subtopicTitle: null,
    href: `/curso?tema=${t.slug}`,
  }
}

/**
 * La columna de la seccion de bienvenida.
 *
 * Va dentro de `LessonScrollArea` con `subtopicId={null}`: eso arranca cada
 * pagina desde arriba —sin el, cambiar de pagina dejaba al lector a la misma
 * altura a la que venia— y a la vez no marca progreso, porque leer la guia no es
 * trabajo del curso. La navegacion es la misma `LessonNav` del temario, que va
 * por `LessonLink` y por tanto enciende el velo de carga.
 *
 * Nada de esto es propio: es lo que ya usa cualquier leccion.
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
  const i = bienvenida.pages.findIndex((p) => p.id === page?.id)
  const anterior = i > 0 ? comoLeccion(bienvenida.pages[i - 1]) : null
  const siguientePagina = bienvenida.pages[i + 1]
  const siguiente = siguientePagina ? comoLeccion(siguientePagina) : primerTema()

  return (
    <LessonScrollArea key={page?.id ?? ""} topicNumber={0} subtopicId={null}>
      <LessonContainer>
        <LessonHeader
          topicTitle={bienvenida.title}
          topicSlug={bienvenida.slug}
          lessonTitle={page?.title ?? bienvenida.title}
        />

        {page?.kind === "roadmap" ? (
          <CourseRoadmap topicLessons={topicLessons} />
        ) : blocks && blocks.length > 0 ? (
          <LessonBody blocks={blocks} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Esta página todavía no tiene contenido.
          </p>
        )}

        <LessonNav currentTopicNumber={0} prev={anterior} next={siguiente} />
      </LessonContainer>
    </LessonScrollArea>
  )
}
