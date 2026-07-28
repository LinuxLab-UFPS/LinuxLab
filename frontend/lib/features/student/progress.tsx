"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "linuxlab:read-lessons"

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
 * INTERIM IMPLEMENTATION: progress lives in localStorage, so it is per-browser
 * and does not sync across devices or survive clearing site data. This stands in
 * for the progress seam (lib/data/submissions.ts) until the backend and auth
 * exist; when they do, swap the storage calls below for real API calls and no UI
 * component changes.
 */
export function LessonProgressProvider({ children }: { children: React.ReactNode }) {
  const [read, setRead] = useState<Set<string>>(new Set())
  // Storage is only available on the client, so the first render (and the server
  // render it hydrates against) always starts empty.
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setRead(new Set(JSON.parse(raw) as string[]))
    } catch {
      // Unavailable or corrupt storage: start from scratch rather than break.
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return // don't overwrite storage with the pre-load empty set
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...read]))
    } catch {
      // Storage full or blocked: progress just won't persist this session.
    }
  }, [read, loaded])

  const markRead = useCallback((topicNumber: number, subtopicId: string) => {
    const key = lessonKey(topicNumber, subtopicId)
    setRead((prev) => (prev.has(key) ? prev : new Set(prev).add(key)))
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
