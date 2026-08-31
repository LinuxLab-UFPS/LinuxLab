import { SiteHeader } from "@/lib/features/student/components/site-header"
import { GroupSidebar } from "@/lib/features/student/components/group-sidebar"
import { GroupBody } from "@/lib/features/student/components/group-body"
import { ContentArea } from "@/lib/features/student/components/content-area"
import { GroupTerminal } from "@shared/components/group-terminal"
import { syllabus, getTopicBySlug } from "@shared/lib/content/temario"
import { bienvenida, esBienvenida, paginaBienvenida } from "@shared/lib/content/bienvenida"
import { WelcomeArea } from "@/lib/features/student/components/welcome-area"
import { getBienvenidaMarkdown } from "@shared/lib/content/lessons"
import {
  getTopicContentMeta,
  getSubtopicMarkdown,
  getLessonNeighbours,
  getTopicLessons,
  getSearchIndex,
} from "@shared/lib/content/lessons"
import { getSimulators } from "@shared/lib/content/simulators"
import { parseLessonBlocks } from "@shared/lib/content/lesson-blocks"
import { LessonProgressProvider } from "@/lib/features/student/progress"
import { requireServerRole } from "@/lib/features/auth/session"
import { TerminalUIProvider } from "@shared/components/terminal-ui"
import { LessonLoadingProvider } from "@shared/components/lesson-loading"
import {
  ReadingProgressProvider,
  ReadingProgressBar,
} from "@shared/components/reading-progress"

export default async function GroupPage({
  searchParams,
}: {
  searchParams: Promise<{ tema?: string; sub?: string }>
}) {
  await requireServerRole(["student", "teacher", "admin"])
  const { tema, sub } = await searchParams

  /* La bienvenida se resuelve antes que nada: no tiene numero de tema, y todo
     lo que viene despues (carpeta `tema-NN`, assets, vecinos) se construye a
     partir de ese numero. */
  if (esBienvenida(tema)) {
    const pagina = paginaBienvenida(sub)
    const markdown = pagina?.file ? getBienvenidaMarkdown(pagina.file) : null
    const blocks = markdown ? parseLessonBlocks(markdown, 0, pagina?.title) : null
    return (
      <LessonProgressProvider>
        <TerminalUIProvider>
          <LessonLoadingProvider>
            <div className="flex h-screen flex-col overflow-hidden bg-background">
              <div className="z-40 shrink-0 bg-background">
                <SiteHeader simulators={getSimulators()} searchItems={getSearchIndex()} />
              </div>
              <main className="flex-1 overflow-auto">
                <GroupBody>
                  <GroupSidebar
                    activeTopicSlug={bienvenida.slug}
                    activeSubtopicId={pagina?.id}
                    topicLessons={getTopicLessons()}
                  />
                  <WelcomeArea page={pagina} blocks={blocks} topicLessons={getTopicLessons()} />
                  <GroupTerminal />
                </GroupBody>
              </main>
            </div>
          </LessonLoadingProvider>
        </TerminalUIProvider>
      </LessonProgressProvider>
    )
  }

  const topic = (tema ? getTopicBySlug(tema) : undefined) ?? syllabus[0]

  const meta = getTopicContentMeta(topic.number)
  const activeSubtopic = meta
    ? (meta.subtopics.find((s) => s.id === sub) ?? meta.subtopics[0] ?? null)
    : null

  const isSimulator = activeSubtopic?.type === "simulator"
  const markdown =
    activeSubtopic && !isSimulator
      ? getSubtopicMarkdown(topic.number, activeSubtopic.file)
      : null
  const blocks = isSimulator
    ? [{ kind: "simulator" as const, src: `/temario/tema-${String(topic.number).padStart(2, "0")}/${activeSubtopic!.file}` }]
    : markdown
      ? parseLessonBlocks(markdown, topic.number, activeSubtopic?.title)
      : null

  // Works for topics without content too, so you can keep advancing the syllabus.
  const { prev, next } = getLessonNeighbours(topic.number, activeSubtopic?.id ?? null)

  return (
    <LessonProgressProvider>
      <ReadingProgressProvider>
        <TerminalUIProvider>
         <LessonLoadingProvider>
          {/* El scroll lo tiene el `<main>`, no la ventana. Con el scroll en la
              ventana la barra del navegador es la del viewport entero y corria
              por al lado de la cabecera, que ademas iba `sticky` para taparlo
              sin conseguirlo: ninguna capa se pone por encima de una barra de
              scroll. Asi arranca por debajo, igual que en el resto del sitio.

              Ojo: no vale volver a `h-screen` con `overflow-hidden` a secas.
              Eso ya se probo y dejaba la rueda muerta salvo encima de la lista
              de temas y de la columna de la leccion. Lo que lo arregla es que
              haya un contenedor con scroll que ocupe todo lo que no es la
              cabecera, que es este `<main>`. */}
          <div className="flex h-screen flex-col overflow-hidden bg-background">
            <div className="z-40 shrink-0 bg-background">
              <SiteHeader simulators={getSimulators()} searchItems={getSearchIndex()} />
              <ReadingProgressBar />
            </div>
            <main className="flex-1 overflow-auto">
            <GroupBody>
              <GroupSidebar
                activeTopicSlug={topic.slug}
                activeSubtopicId={activeSubtopic?.id}
                contentSubtopics={meta?.subtopics}
                topicLessons={getTopicLessons()}
              />
              <ContentArea
                topic={topic}
                meta={meta}
                activeSubtopic={activeSubtopic}
                blocks={blocks}
                prev={prev}
                next={next}
              />
              <GroupTerminal />
            </GroupBody>
            </main>
          </div>
         </LessonLoadingProvider>
        </TerminalUIProvider>
      </ReadingProgressProvider>
    </LessonProgressProvider>
  )
}
