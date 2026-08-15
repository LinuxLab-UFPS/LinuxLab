import { SiteHeader } from "@/lib/features/student/components/site-header"
import { GroupSidebar } from "@/lib/features/student/components/group-sidebar"
import { GroupBody } from "@/lib/features/student/components/group-body"
import { ContentArea } from "@/lib/features/student/components/content-area"
import { GroupTerminal } from "@shared/components/group-terminal"
import { syllabus, getTopicBySlug } from "@shared/lib/content/temario"
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
      ? parseLessonBlocks(markdown, topic.number)
      : null

  // Works for topics without content too, so you can keep advancing the syllabus.
  const { prev, next } = getLessonNeighbours(topic.number, activeSubtopic?.id ?? null)

  return (
    <LessonProgressProvider>
      <ReadingProgressProvider>
        <TerminalUIProvider>
          {/* `min-h-screen` y no `h-screen`: el documento tiene que poder crecer
              para que el scroll sea el de la ventana. Antes la altura estaba
              clavada al viewport y las unicas zonas que respondian a la rueda
              eran la lista de temas y la columna de la leccion; sobre la
              cabecera, los huecos o la terminal no pasaba nada. */}
          <div className="flex min-h-screen flex-col bg-background">
            <div className="sticky top-0 z-40 bg-background">
              <SiteHeader simulators={getSimulators()} searchItems={getSearchIndex()} />
              <ReadingProgressBar />
            </div>
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
          </div>
        </TerminalUIProvider>
      </ReadingProgressProvider>
    </LessonProgressProvider>
  )
}
