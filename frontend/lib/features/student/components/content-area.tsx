import { BookOpen, FileText, Link2, Video, type LucideIcon } from "lucide-react"
import { LessonBody } from "@shared/components/lesson-body"
import { LessonNav } from "@shared/components/lesson-nav"
import { LessonSources } from "@shared/components/lesson-sources"
import { SimulatorLesson } from "@shared/components/simulator-lesson"
import { LessonScrollArea } from "@shared/components/lesson-scroll-area"
import { LessonContainer } from "@shared/components/terminal-ui"
import { LessonHeader } from "@shared/components/lesson-header"
import { SidebarMovil } from "@/lib/features/student/components/sidebar-movil"
import type { Topic } from "@/lib/features/student/types"
import type { LessonResource, LessonSubtopic, TopicContentMeta } from "@/lib/models/content"
import type { LessonBlock } from "@shared/lib/content/lesson-blocks"
import type { LessonRef, TopicLessons } from "@shared/lib/content/lessons"

interface ContentAreaProps {
  topic: Topic
  meta: TopicContentMeta | null
  activeSubtopic: LessonSubtopic | null
  blocks: LessonBlock[] | null
  prev: LessonRef | null
  next: LessonRef | null
  /** Para el panel de contenidos plegado, que en movil vive aqui dentro. */
  topicLessons: Record<number, TopicLessons>
}

/**
 * Renders the lesson material for the active topic/subtopic.
 *
 * The `key` on the scroll area is load-bearing: that element is the scroll
 * container, so without it a client-side navigation would keep the previous
 * scroll position and drop you at the bottom of the next lesson. Changing the key
 * remounts it, which starts the new lesson at the top.
 */
export function ContentArea({
  topic,
  meta,
  activeSubtopic,
  blocks,
  prev,
  next,
  topicLessons,
}: ContentAreaProps) {
  // The bibliography is rendered after the nav, not inline with the lesson.
  const sources = blocks?.find(
    (b): b is Extract<LessonBlock, { kind: "sources" }> => b.kind === "sources",
  )
  const bodyBlocks = blocks?.filter((b) => b.kind !== "sources") ?? null

  return (
    <LessonScrollArea
      key={`${topic.slug}/${activeSubtopic?.id ?? ""}`}
      topicNumber={topic.number}
      subtopicId={activeSubtopic?.id ?? null}
    >
      {activeSubtopic?.type === "simulator" ? (
        <SimulatorLesson
          src={`/temario/tema-${String(topic.number).padStart(2, "0")}/${activeSubtopic.file}`}
          prev={prev}
          next={next}
          currentTopicNumber={topic.number}
        />
      ) : (
        <LessonContainer>
          {/* El panel de contenidos, plegado. Solo en movil: en escritorio esta
              en su columna y aqui estorbaria. */}
          <div className="mb-6">
            <SidebarMovil
              activeTopicSlug={topic.slug}
              activeSubtopicId={activeSubtopic?.id}
              contentSubtopics={meta?.subtopics}
              topicLessons={topicLessons}
              topicTitle={`${topic.number}. ${topic.title}`}
              lessonTitle={activeSubtopic?.title}
            />
          </div>

          {/* La rama de simulador no pasa por aqui: monta su propia portada con
              su titulo, y dos cabeceras seguidas sobraban. */}
          <LessonHeader
            topicTitle={topic.title}
            topicSlug={topic.slug}
            lessonTitle={activeSubtopic?.title ?? topic.title}
          />

          {bodyBlocks && bodyBlocks.length > 0 ? (
            <LessonBody blocks={bodyBlocks} />
          ) : (
            <div className="max-w-md mx-auto text-center py-16">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-secondary/60 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-muted-foreground" />
              </div>
              <h2 className="text-base font-medium text-foreground mb-1">Material no disponible</h2>
              <p className="text-sm text-muted-foreground">
                El contenido de este tema aún no está publicado.
              </p>
            </div>
          )}

          <LessonNav currentTopicNumber={topic.number} prev={prev} next={next} />

          {sources && <LessonSources content={sources.content} />}

          {meta && meta.resources.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Recursos
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {meta.resources.map((resource) => (
                  <ResourceCard key={resource.url} resource={resource} />
                ))}
              </div>
            </section>
          )}
        </LessonContainer>
      )}
    </LessonScrollArea>
  )
}

const RESOURCE_ICONS: Record<string, LucideIcon> = {
  pdf: FileText,
  book: BookOpen,
  video: Video,
  link: Link2,
}

function ResourceCard({ resource }: { resource: LessonResource }) {
  const Icon = RESOURCE_ICONS[resource.type] ?? Link2
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noreferrer"
      className="group flex w-full min-w-0 items-center gap-3 rounded-lg border border-black/15 p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[var(--neon-glow-strong)] dark:border-border"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
          {resource.title}
        </h3>
        {resource.detail && (
          <p className="truncate text-xs text-muted-foreground">{resource.detail}</p>
        )}
      </div>
      <Link2 className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
    </a>
  )
}
