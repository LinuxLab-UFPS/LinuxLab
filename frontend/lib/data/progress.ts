import { apiFetch } from "@/lib/api/client"
import type { ProgressResponse } from "@/lib/models/progress"

export async function fetchProgress(): Promise<ProgressResponse> {
  return apiFetch<ProgressResponse>("/api/progress")
}

export async function recordLessonView(topicSlug: string, subtopicId: string): Promise<void> {
  await apiFetch<void>(`/api/lessons/${topicSlug}/${subtopicId}/view`, { method: "POST" })
}
