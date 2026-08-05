"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api/client"

/**
 * Which activities the student has already passed. Cards use it for the
 * "Completada" tag, and the terminal panel uses it to suggest only pending work.
 * A failed request just means no badges, never a broken page.
 */
export function usePassedActivities(): { passed: Set<string>; loading: boolean } {
  const [passed, setPassed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    apiFetch<{ passed: string[] }>("/api/activities/mine/status")
      .then((data) => {
        if (alive) setPassed(new Set(data.passed))
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return { passed, loading }
}
