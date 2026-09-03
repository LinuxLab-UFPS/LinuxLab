import { ListChecks, FolderOpen, BarChart3 } from "lucide-react"
import { ActionButton } from "@shared/components/action-button"
import { BackButton } from "@shared/components/back-button"
import { getGroupActivity, listActivitySubmissions, listManualSubmissions } from "@/lib/features/teacher/data"
import { getTopic } from "@shared/lib/content/temario"
import { DIFFICULTY_LABEL } from "@shared/lib/content/activities"
import { describeCheck } from "@shared/lib/describe-check"
import { requireServerRole } from "@/lib/features/auth/session"
import type { Activity } from "@/lib/features/teacher/types"
import { formatBogotaDateTime } from "@/lib/utils/dates"
import { SubmissionsTable } from "@/lib/features/teacher/components/submissions-table"
import { ExtendDueDateButton } from "@/lib/features/teacher/components/extend-due-date-button"

const ROW =
  "flex items-center justify-between gap-4 border-b border-border/50 px-4 py-2.5 text-sm last:border-0"

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={ROW}>
      <span className="font-medium text-foreground">{label}</span>
      <span className="text-right text-muted-foreground">{children}</span>
    </div>
  )
}

function ActivityDetail({
  groupId,
  activity,
  submissions,
  manualSubmissions,
  backTab,
}: {
  groupId: string
  activity: Activity
  submissions: { studentId: string; studentName: string; studentEmail: string; studentCode: string | null; attemptsCount: number; lastAttemptDate: string | null; finalScore: number }[]
  manualSubmissions: { submissionId: string; studentId: string; studentName: string; studentEmail: string; studentCode: string | null; status: string; score: number | null; submittedAt: string; files: number }[]
  backTab: string
}) {
  const topic = getTopic(activity.topicNumber)
  const hasEntregas = submissions.length > 0 || manualSubmissions.length > 0
  const studentDetailHref = (studentId: string) =>
    `/grupos/${groupId}/actividades/${activity.id}/estudiantes/${studentId}${backTab === "calificaciones" ? "?from=calificaciones" : ""}`
  const manualRows = manualSubmissions.map((sub) => ({
    studentId: sub.studentId,
    studentName: sub.studentName,
    studentCode: sub.studentCode,
    middleLabel: sub.status === "graded" ? "Calificada" : "Pendiente",
    middleTone: (sub.status === "graded" ? "success" : "warning") as "success" | "warning",
    submittedAt: sub.submittedAt,
    scoreLabel: sub.score != null ? `${sub.score}/${activity.maxScore}` : "—",
    scoreValue: sub.score ?? null,
    href: studentDetailHref(sub.studentId),
  }))
  const automaticRows = submissions.map((sub) => ({
    studentId: sub.studentId,
    studentName: sub.studentName,
    studentCode: sub.studentCode,
    middleLabel: String(sub.attemptsCount),
    middleTone: "muted" as const,
    submittedAt: sub.lastAttemptDate,
    scoreLabel: `${sub.finalScore}/${activity.maxScore}`,
    scoreValue: sub.finalScore,
    href: studentDetailHref(sub.studentId),
  }))
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <BackButton fallback={`/grupos/${groupId}?tab=${backTab}`} />

      <div className="grid gap-6 mt-9 lg:grid-cols-[1fr_1.2fr]">
        {/* Columna izquierda: detalle completo */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{activity.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {topic ? `${topic.number}. ${topic.title}` : "Sin tema asociado"}
              </p>
            </div>
            {hasEntregas ? (
              <ExtendDueDateButton
                groupId={groupId}
                activityId={activity.id}
                currentDueDate={activity.dueDate ?? null}
              />
            ) : (
              <ActionButton tone="primary" href={`/grupos/${groupId}/actividades/crear?edit=${activity.id}`}>
                Editar
              </ActionButton>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <DetailRow label="Modalidad">
              {activity.evaluationType === "manual" ? "Revision manual" : "Autoevaluacion"}
            </DetailRow>
            <DetailRow label="Tipo de actividad">
              {activity.activityType === "quiz" ? "Quiz" : "Taller"}
            </DetailRow>
            <DetailRow label="Dificultad">
              {activity.difficulty ? DIFFICULTY_LABEL[activity.difficulty] : "—"}
            </DetailRow>
            <DetailRow label="Puntuacion">{activity.maxScore} pts</DetailRow>
            <DetailRow label="Fecha de cierre">
              {activity.dueDate ? formatBogotaDateTime(activity.dueDate) : "Sin fecha"}
            </DetailRow>
            <DetailRow label="Carpeta de trabajo">
              <span className="flex items-center justify-end gap-1.5 font-mono">
                <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                ~/actividades/{activity.workdir}
              </span>
            </DetailRow>
          </div>

          {activity.instructions && (
            <section>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Instrucciones
              </h2>
              <div className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                {activity.instructions}
              </div>
            </section>
          )}

          {activity.evaluationType !== "manual" && (
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              <ListChecks className="h-4 w-4" />
              Aserciones ({activity.checks.length})
            </h2>
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-card border-b border-border">
                      <th className="w-10 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">
                        #
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                        Descripción
                      </th>
                      <th className="w-20 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">
                        Puntos
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.checks.map((check, index) => (
                      <tr key={check.id} className="border-b border-border/50 bg-background last:border-0">
                        <td className="px-4 py-2.5 text-sm text-muted-foreground">{index + 1}</td>
                        <td className="px-4 py-2.5 text-sm text-foreground">
                          {describeCheck(check.type, check.params)}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono text-sm text-foreground">
                          {check.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
          )}
        </div>

        {/* Columna derecha: entregas */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            <BarChart3 className="h-4 w-4" />
            {activity.evaluationType === "manual"
              ? `Entregas (${manualSubmissions.length})`
              : `Intentos (${submissions.length})`}
          </h2>
          {activity.evaluationType === "manual" ? (
            <SubmissionsTable variant="manual" rows={manualRows} />
          ) : (
            <SubmissionsTable variant="automatic" rows={automaticRows} />
          )}
        </section>
      </div>
    </div>
  )
}

export default async function ActivityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; activityId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireServerRole(["teacher", "admin"])
  const { id, activityId } = await params
  const sp = await searchParams
  const backTab = sp.from === "calificaciones" ? "calificaciones" : "actividades"
  const [activity, submissions, manualSubmissions] = await Promise.all([
    getGroupActivity(id, activityId),
    listActivitySubmissions(id, activityId),
    listManualSubmissions(id, activityId),
  ])

  if (!activity) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h2 className="mb-1 text-base font-medium text-foreground">Actividad no encontrada</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Esta actividad no existe o no pertenece al curso.
        </p>
        <BackButton fallback={`/grupos/${id}?tab=${backTab}`} label="Volver al curso" />
      </div>
    )
  }

  return <ActivityDetail groupId={id} activity={activity} submissions={submissions} manualSubmissions={manualSubmissions} backTab={backTab} />
}
