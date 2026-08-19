"use client"

import { useState } from "react"
import { CalendarClock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { ActionButton } from "@shared/components/action-button"
import { extendActivityDueDate } from "@/lib/features/teacher/data"
import { queryKeys } from "@/lib/api/queries"
import { ExtendDueDateDialog } from "@/lib/features/teacher/components/extend-due-date-dialog"

/** Botón "Extender fecha" del detalle de actividad: abre el modal y, al
 *  confirmar, actualiza la fecha de cierre e invalida las consultas. */
export function ExtendDueDateButton({
  groupId,
  activityId,
  currentDueDate,
}: {
  groupId: string
  activityId: string
  currentDueDate: string | null
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  const submit = async (dueDate: string) => {
    await extendActivityDueDate(groupId, activityId, dueDate)
    queryClient.invalidateQueries({ queryKey: queryKeys.groupActivities(groupId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.gradebook(groupId) })
    router.refresh()
  }

  return (
    <>
      <ActionButton tone="primary" onClick={() => setOpen(true)}>
        <CalendarClock className="h-4 w-4" />
        Extender fecha
      </ActionButton>
      <ExtendDueDateDialog
        open={open}
        currentDueDate={currentDueDate}
        onSubmit={submit}
        onOpenChange={setOpen}
      />
    </>
  )
}
