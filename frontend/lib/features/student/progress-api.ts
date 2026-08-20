import { apiFetch } from "@/lib/api/client"
import type { StudentGroupDetail } from "@/lib/models/groups"

export type { StudentGroupDetail }

export interface MyReadLesson {
  topicNumber: number
  subtopicSlug: string
  readAt: string
}

/** Progreso del estudiante en su grupo activo; null si no tiene grupo. */
export async function getMyProgress(): Promise<StudentGroupDetail | null> {
  return apiFetch<StudentGroupDetail | null>("/api/progress/mine")
}

/** Lecciones ya leídas del estudiante en su grupo activo. */
export async function getMyReadLessons(): Promise<MyReadLesson[]> {
  const res = await apiFetch<{ lessons: MyReadLesson[] }>("/api/progress/mine/lessons")
  return res.lessons
}

/** Marca una lección como leída en el grupo activo (idempotente). */
export async function markLessonRead(topicNumber: number, subtopicSlug: string): Promise<void> {
  await apiFetch("/api/progress/lesson-read", {
    method: "POST",
    body: JSON.stringify({ topicNumber, subtopicSlug }),
  })
}