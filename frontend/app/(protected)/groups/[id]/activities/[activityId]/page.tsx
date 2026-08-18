import Link from "next/link"
import { ArrowLeft, Pencil, ListChecks, FolderOpen, BarChart3 } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { ActionButton } from "@shared/components/action-button"
import { getGroupActivity, listActivitySubmissions, listManualSubmissions } from "@/lib/features/teacher/data"
import { getTopic } from "@shared/lib/content/temario"
import { requireServerRole } from "@/lib/features/auth/session"
import type { Activity } from "@/lib/features/teacher/types"
import { formatBogotaDateTime } from "@/lib/utils/dates"
import { SubmissionsTable } from "@/lib/features/teacher/components/submissions-table"

const ROW =
  "flex items-center justify-between gap-4 border-b border-border/50 px-4 py-2.5 text-sm last:border-0"

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={ROW}>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{children}</span>
    </div>
  )
}

function ActivityDetail({
  groupId,
  activity,
  submissions,
  manualSubmissions,
}: {
  groupId: string
  activity: Activity
  submissions: { studentId: string; studentName: string; studentEmail: string; studentCode: string | null; attemptsCount: number; lastAttemptDate: string | null; finalScore: number }[]
  manualSubmissions: { submissionId: string; studentId: string; studentName: string; studentEmail: string; studentCode: string | null; status: string; score: number | null; submittedAt: string; files: number }[]
}) {
  const topic = getTopic(activity.topicNumber)
  return (
    <div data-section="cursos" className="mx-auto max-w-7xl px-6 py-8">
      <ActionButton tone="neutral" href={`/groups/${groupId}?tab=actividades`}>
        <ArrowLeft className="h-4 w-4" />
        Volver
      </ActionButton>

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
            <ActionButton tone="amber" href={`/groups/${groupId}/new-activity?edit=${activity.id}`}>
              <Pencil className="h-4 w-4" />
              Editar
            </ActionButton>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <DetailRow label="Modalidad">
              {activity.evaluationType === "manual" ? "Revision manual" : "Autoevaluacion"}
            </DetailRow>
            <DetailRow label="Tipo de actividad">
              {activity.activityType === "quiz" ? "Quiz" : "Taller"}
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
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">
                        Tipo
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">
                        Parametros
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
                        <td className="px-4 py-2.5 font-mono text-sm text-foreground">{check.type}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                          {JSON.stringify(check.params)}
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
            <SubmissionsTable submissions={manualSubmissions} maxScore={activity.maxScore} />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-card border-b border-border">
                      <th className="w-28 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Codigo</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Estudiante</th>
                      <th className="w-20 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">Intentos</th>
                      <th className="w-44 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                      <th className="w-32 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">Calificacion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Aun no hay entregas registradas.</td></tr>
                    ) : (
                      submissions.map((sub) => (
                        <tr key={sub.studentId} className="border-b border-border/50 bg-background last:border-0">
                          <td className="px-4 py-2.5 font-mono text-sm text-muted-foreground">{sub.studentCode ?? "—"}</td>
                          <td className="px-4 py-2.5 text-sm font-medium text-foreground">{sub.studentName}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-sm text-foreground">{sub.attemptsCount}</td>
                          <td className="px-4 py-2.5 text-sm text-muted-foreground">{sub.lastAttemptDate ? formatBogotaDateTime(sub.lastAttemptDate) : "—"}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-sm text-foreground">{sub.finalScore}/{activity.maxScore}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string; activityId: string }>
}) {
  await requireServerRole(["teacher", "admin"])
  const { id, activityId } = await params
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
        <Link href={`/groups/${id}`}>
          <Button variant="outline">Volver al curso</Button>
        </Link>
      </div>
    )
  }

  return <ActivityDetail groupId={id} activity={activity} submissions={submissions} manualSubmissions={manualSubmissions} />
}
