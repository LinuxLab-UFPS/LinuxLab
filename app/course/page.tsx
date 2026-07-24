import { SiteHeader } from "@/components/student/site-header"
import { CourseSidebar } from "@/components/student/course-sidebar"
import { ContentArea } from "@/components/student/content-area"
import { CourseTerminal } from "@/components/shared/course-terminal"
import { syllabus, getTopicBySlug } from "@/lib/features/shared/temario"
import {
  getTopicContentMeta,
  getSubtopicMarkdown,
  getLessonNeighbours,
  getTopicLessonCounts,
  getSimulators,
  getSearchIndex,
} from "@/lib/features/shared/lessons"
import { parseLessonBlocks } from "@/lib/features/shared/lesson-blocks"
import { LessonProgressProvider } from "@/lib/features/student/progress"
import { TerminalUIProvider } from "@/components/shared/terminal-ui"
import {
  ReadingProgressProvider,
  ReadingProgressBar,
} from "@/components/shared/reading-progress"

export default async function CoursePage({
  searchParams,
}: {
  searchParams: Promise<{ tema?: string; sub?: string }>
}) {
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
          <div className="flex h-screen flex-col bg-background">
            <SiteHeader simulators={getSimulators()} searchItems={getSearchIndex()} />
            <ReadingProgressBar />
            <div className="flex flex-1 overflow-hidden">
              <CourseSidebar
                activeTopicSlug={topic.slug}
                activeSubtopicId={activeSubtopic?.id}
                contentSubtopics={meta?.subtopics}
                lessonCounts={getTopicLessonCounts()}
              />
              <ContentArea
                topic={topic}
                meta={meta}
                activeSubtopic={activeSubtopic}
                blocks={blocks}
                prev={prev}
                next={next}
              />
              <CourseTerminal />
            </div>
          </div>
        </TerminalUIProvider>
      </ReadingProgressProvider>
    </LessonProgressProvider>
  )
}
