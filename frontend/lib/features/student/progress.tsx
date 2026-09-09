"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { fetchProgress, recordLessonView } from "@/lib/data/progress"
import { syllabus } from "@shared/lib/content/temario"

function lessonKey(topicNumber: number, subtopicId: string): string {
  return `${topicNumber}/${subtopicId}`
}

interface LessonProgressValue {
  isRead: (topicNumber: number, subtopicId: string) => boolean
  markRead: (topicNumber: number, subtopicId: string) => void
  readKeys: string[]
  /** How many lessons of a topic have been read. */
  readCountForTopic: (topicNumber: number) => number
  /** Clears all stored progress. */
  reset: () => void
  loading: boolean
}

const LessonProgressContext = createContext<LessonProgressValue | null>(null)

/**
 * @param soloLectura Quien mira el temario sin cursarlo: el docente repasando el
 * material. No se le pide su progreso —no tiene matricula, y el backend le
 * devolveria todo vacio— ni se apunta lo que lee, para que pasearse por una
 * leccion no deje rastro en las cifras de nadie.
 */
export function LessonProgressProvider({
  children,
  soloLectura = false,
}: {
  children: React.ReactNode
  soloLectura?: boolean
}) {
  const [readKeys, setReadKeys] = useState<string[]>([])
  const [loading, setLoading] = useState(!soloLectura)
  // Guarda los subtemas cuya vista ya se informó al backend, para que cada
  // lección genere una sola petición aunque markRead se dispare muchas veces
  // (scroll repetido, ResizeObserver, o el settle del short-lesson).
  const reportedViews = useRef(new Set<string>())

  useEffect(() => {
    if (soloLectura) return
    let cancelled = false
    fetchProgress()
      .then((data) => {
        if (cancelled) return
        setReadKeys(data.readKeys ?? [])
      })
      .catch(() => {
        /* sin conexión: empieza vacío */
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [soloLectura])

  const isRead = useCallback(
    (topicNumber: number, subtopicId: string) => readKeys.includes(lessonKey(topicNumber, subtopicId)),
    [readKeys],
  )

  const markRead = useCallback(
    (topicNumber: number, subtopicId: string) => {
      if (soloLectura) return
      const key = lessonKey(topicNumber, subtopicId)
      setReadKeys((prev) => (prev.includes(key) ? prev : [...prev, key]))

      if (reportedViews.current.has(key)) return
      reportedViews.current.add(key)

      const slug = syllabus.find((t) => t.number === topicNumber)?.slug
      if (slug) recordLessonView(slug, subtopicId).catch(() => {})
    },
    [soloLectura],
  )

  const readCountForTopic = useCallback(
    (topicNumber: number) => {
      const prefix = `${topicNumber}/`
      return readKeys.filter((k) => k.startsWith(prefix)).length
    },
    [readKeys],
  )

  const reset = useCallback(() => setReadKeys([]), [])

  const value = useMemo<LessonProgressValue>(
    () => ({ isRead, markRead, readKeys, readCountForTopic, reset, loading }),
    [isRead, markRead, readKeys, readCountForTopic, reset, loading],
  )

  return (
    <LessonProgressContext.Provider value={value}>{children}</LessonProgressContext.Provider>
  )
}

export function useLessonProgress(): LessonProgressValue {
  const ctx = useContext(LessonProgressContext)
  if (!ctx) {
    throw new Error("useLessonProgress must be used within <LessonProgressProvider>.")
  }
  return ctx
}
