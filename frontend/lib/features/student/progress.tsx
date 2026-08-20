"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { getMyReadLessons, markLessonRead } from "./progress-api"

const STORAGE_KEY = "linuxlab:read-lessons"

// Los subtemas se identifican por su slug en meta.json, que es el mismo slug
// que guarda la BD (subtopics.slug); por eso la clave tema/subtema basta para
// casar con el backend.
function lessonKey(topicNumber: number, subtopicId: string): string {
  return `${topicNumber}/${subtopicId}`
}

interface LessonProgressValue {
  isRead: (topicNumber: number, subtopicId: string) => boolean
  markRead: (topicNumber: number, subtopicId: string) => void
  /** How many lessons of a topic have been read. */
  readCountForTopic: (topicNumber: number) => number
  /** Clears all stored progress. */
  reset: () => void
}

const LessonProgressContext = createContext<LessonProgressValue | null>(null)

/**
 * Tracks which lessons the student has already read.
 *
 * The backend (lesson_progress, scoped por grupo) is the source of truth: on
 * mount we hydrate from `GET /api/progress/mine/lessons` and every markRead
 * pushes to `POST /api/progress/lesson-read`. localStorage is kept as an
 * offline cache: if the API is unreachable the UI still works and the marks
 * are re-synced on the next load.
 */
export function LessonProgressProvider({ children }: { children: React.ReactNode }) {
  const [read, setRead] = useState<Set<string>>(new Set())
  // Storage is only available on the client, so the first render (and the server
  // render it hydrates against) always starts empty.
  const [loaded, setLoaded] = useState(false)
  // Evita re-enviar al backend el set completo tras cada hidratación.
  const hydratedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      let server: Set<string> | null = null
      try {
        const lessons = await getMyReadLessons()
        if (cancelled) return
        server = new Set(lessons.map((l) => lessonKey(l.topicNumber, l.subtopicSlug)))
      } catch {
        // Sin sesión o sin red: se cae al caché local.
      }

      if (server) {
        setRead(server)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([...server]))
        } catch {
          // Storage lleno o bloqueado: solo afecta al caché.
        }
      } else {
        try {
          const raw = localStorage.getItem(STORAGE_KEY)
          if (raw) setRead(new Set(JSON.parse(raw) as string[]))
        } catch {
          // Unavailable or corrupt storage: start from scratch rather than break.
        }
      }
      hydratedRef.current = true
      setLoaded(true)
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!loaded) return // don't overwrite storage with the pre-load empty set
    // Tras la hidratación el estado ya refleja lo del server; este efecto solo
    // refuerza el caché local (con el set completo) para el modo offline.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...read]))
    } catch {
      // Storage full or blocked: progress just won't persist this session.
    }
  }, [read, loaded])

  const markRead = useCallback((topicNumber: number, subtopicId: string) => {
    const key = lessonKey(topicNumber, subtopicId)
    setRead((prev) => (prev.has(key) ? prev : new Set(prev).add(key)))
    // Best-effort: el backend es idempotente; si falla (offline) el caché local
    // aguanta el estado y la próxima hidratación lo corrige.
    markLessonRead(topicNumber, subtopicId).catch(() => {})
  }, [])

  const value = useMemo<LessonProgressValue>(
    () => ({
      markRead,
      isRead: (topicNumber, subtopicId) => read.has(lessonKey(topicNumber, subtopicId)),
      readCountForTopic: (topicNumber) => {
        // "1/" never prefixes "11/x", so topic numbers don't collide.
        const prefix = `${topicNumber}/`
        let count = 0
        for (const key of read) if (key.startsWith(prefix)) count++
        return count
      },
      reset: () => setRead(new Set()),
    }),
    [read, markRead],
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