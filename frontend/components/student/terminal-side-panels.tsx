"use client"

import { useState } from "react"
import { ArrowLeft, Target } from "lucide-react"
import { EssentialCommands } from "@/components/student/essential-commands"
import { getSuggestedActivities } from "@/lib/features/student/activities"

/**
 * The two panels next to the terminal: the essential-commands cheat sheet and
 * the suggested-activities list. Selecting an activity replaces BOTH with a
 * single detail card (title + description + Siguiente); going back restores
 * the two-panel view.
 */
export function TerminalSidePanels() {
  const activities = getSuggestedActivities()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (selectedIndex !== null) {
    const activity = activities[selectedIndex]
    const hasNext = selectedIndex < activities.length - 1

    return (
      <div className="rounded-xl border border-black/15 bg-background p-4 dark:border-border">
        <button
          type="button"
          onClick={() => setSelectedIndex(null)}
          className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-500 transition-colors hover:text-amber-400"
        >
          <ArrowLeft className="h-4 w-4" />
          {activity.title}
        </button>
        <p className="text-sm leading-relaxed text-muted-foreground">{activity.description}</p>

        {hasNext && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setSelectedIndex(selectedIndex + 1)}
              className="rounded-md bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-500 transition-colors hover:bg-amber-500/25"
            >
              Siguiente Actividad
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <EssentialCommands />

      <div className="rounded-xl border border-black/15 bg-background p-4 dark:border-border">
        <h2 className="mb-3 text-sm font-bold text-amber-500">Actividades sugeridas</h2>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay actividades sugeridas.</p>
        ) : (
          <div className="space-y-2">
            {activities.map((activity, i) => (
              <button
                key={activity.id}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className="group flex w-full items-start gap-3 rounded-lg border border-transparent p-2.5 text-left transition-colors hover:border-amber-500/40 hover:bg-amber-500/5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <Target className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground transition-colors group-hover:text-amber-500">
                    {activity.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {activity.description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
