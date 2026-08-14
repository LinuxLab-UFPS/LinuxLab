"use client"

import { useEffect, useRef } from "react"
import { useLessonProgress } from "@/lib/features/student/progress"
import { useSetReadingProgress } from "@shared/components/reading-progress"

/** Below this the lesson counts as read. Reaching an exact 100% is fiddly. */
const READ_AT = 95

/**
 * The lesson's scroll container. It reports scroll progress to the reading-bar
 * under the global header (not to a bar of its own), and marks the lesson read
 * once you reach the end.
 */
export function LessonScrollArea({
  topicNumber,
  subtopicId,
  children,
}: {
  topicNumber: number
  subtopicId: string | null
  children: React.ReactNode
}) {
  const scrollRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const { markRead } = useLessonProgress()
  const setProgress = useSetReadingProgress()

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let settle: ReturnType<typeof setTimeout> | undefined

    const update = () => {
      const max = el.scrollHeight - el.clientHeight

      if (max <= 8) {
        // Nothing to scroll: a short lesson, or a simulator. It counts as read,
        // but only once the layout stops changing — images and video load late
        // and would otherwise mark it read before the content is even there.
        setProgress(100)
        clearTimeout(settle)
        if (subtopicId) {
          settle = setTimeout(() => markRead(topicNumber, subtopicId), 1200)
        }
        return
      }

      const value = Math.min(100, Math.round((el.scrollTop / max) * 100))
      setProgress(value)
      if (value >= READ_AT && subtopicId) markRead(topicNumber, subtopicId)
    }

    update()
    el.addEventListener("scroll", update, { passive: true })

    // The lesson grows as images and video load, which changes the scrollable
    // height; recompute when it does.
    const observer = new ResizeObserver(update)
    observer.observe(el)
    if (contentRef.current) observer.observe(contentRef.current)

    return () => {
      clearTimeout(settle)
      el.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [topicNumber, subtopicId, markRead, setProgress])

  return (
    <main ref={scrollRef} className="no-scrollbar flex flex-1 flex-col overflow-y-auto bg-background">
      <div ref={contentRef} className="flex-1">
        {children}
      </div>
    </main>
  )
}
