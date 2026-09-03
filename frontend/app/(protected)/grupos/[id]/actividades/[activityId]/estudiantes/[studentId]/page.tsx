import { BackButton } from "@shared/components/back-button"
import { requireServerRole } from "@/lib/features/auth/session"
import { teacherApi } from "@/lib/features/teacher/api"
import { StudentActivityDetail } from "@/lib/features/teacher/components/student-activity-detail"

export default async function StudentActivityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; activityId: string; studentId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await requireServerRole(["teacher", "admin", "student"])
  const { user } = session
  const { id, activityId, studentId } = await params
  const sp = await searchParams
  const backHref =
    sp.from === "calificaciones"
      ? `/grupos/${id}/actividades/${activityId}?from=calificaciones`
      : `/grupos/${id}/actividades/${activityId}`

  if (user.role === "student" && user.id !== studentId) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h2 className="mb-1 text-base font-medium text-foreground">Acceso denegado</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          No puedes ver las entregas de otros estudiantes.
        </p>
        <BackButton fallback="/actividades" label="Volver a actividades" />
      </div>
    )
  }

  let detail
  try {
    detail = await teacherApi.getStudentActivityDetail(id, activityId, studentId)
  } catch {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h2 className="mb-1 text-base font-medium text-foreground">No encontrado</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          No se encontró la entrega de este estudiante.
        </p>
        <BackButton fallback={`/grupos/${id}/actividades/${activityId}`} label="Volver a la actividad" />
      </div>
    )
  }

  return (
    <StudentActivityDetail
      detail={detail}
      groupId={id}
      backHref={backHref}
      isTeacher={user.role === "teacher" || user.role === "admin"}
    />
  )
}
