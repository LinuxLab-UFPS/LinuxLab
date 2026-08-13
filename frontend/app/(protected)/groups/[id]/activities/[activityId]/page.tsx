import Link from "next/link"
import { ChevronLeft, ChevronRight, Pencil, ListChecks, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ActionButton } from "@/components/shared/action-button"
import { getGroup, getGroupActivity } from "@/lib/features/teacher/data"
import { getTopic } from "@/lib/features/shared/temario"
import { requireServerRole } from "@/lib/features/auth/session"
import type { Activity } from "@/lib/features/teacher/types"

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

function ActivityDetail({ groupId, activity }: { groupId: string; activity: Activity }) {
  const topic = getTopic(activity.topicNumber)
  return (
    <div data-section="cursos" className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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
          {activity.evaluationType === "manual" ? "Revisión manual" : "Autoevaluación"}
        </DetailRow>
        <DetailRow label="Política de calificación">
          {activity.gradingPolicy === "latest_score" ? "Último intento" : "Mejor intento"}
        </DetailRow>
        <DetailRow label="Puntuación">{activity.maxScore} pts</DetailRow>
        <DetailRow label="Fecha de cierre">
          {activity.dueDate
            ? new Date(activity.dueDate).toLocaleString("es-CO", {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "Sin fecha"}
        </DetailRow>
        <DetailRow label="Carpeta de trabajo">
          <span className="flex items-center justify-end gap-1.5 font-mono">
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ~/actividades/{activity.workdir}
          </span>
        </DetailRow>
      </div>

      {activity.instructions && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Instrucciones
          </h2>
          <div className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {activity.instructions}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
          <ListChecks className="h-4 w-4" />
          Aserciones ({activity.checks.length})
        </h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-card border-b border-border">
                  <th className="w-10 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                    #
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                    Tipo
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                    Parámetros
                  </th>
                  <th className="w-20 px-4 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase">
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
                    <td className="px-4 py-2.5 text-right font-mono text-sm text-foreground">
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
  )
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string; activityId: string }>
}) {
  await requireServerRole(["teacher", "admin"])
  const { id, activityId } = await params
  const [group, activity] = await Promise.all([getGroup(id), getGroupActivity(id, activityId)])

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link href="/home" className="hover:text-foreground transition-colors">
              Mis Grupos
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/groups/${id}`} className="hover:text-foreground transition-colors">
              {group?.name ?? "Grupo"}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">Detalle de actividad</span>
          </nav>
          <Link href={`/groups/${id}`}>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              Volver al curso
            </Button>
          </Link>
        </div>
      </div>

      {!activity ? (
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <h2 className="mb-1 text-base font-medium text-foreground">Actividad no encontrada</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Esta actividad no existe o no pertenece al curso.
          </p>
          <Link href={`/groups/${id}`}>
            <Button variant="outline">Volver al curso</Button>
          </Link>
        </div>
      ) : (
        <ActivityDetail groupId={id} activity={activity} />
      )}
    </div>
  )
}
