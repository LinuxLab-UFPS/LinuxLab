import Link from "next/link"
import { ListChecks, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { getTopic } from "@/lib/features/shared/temario"
import type { GroupActivitySummary } from "@/lib/features/student/group-activities"

const PILL = "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"

/**
 * Las actividades que el docente publicó para el curso, debajo del catálogo.
 *
 * Van aquí y no en «Mi Grupo» porque una actividad es una actividad venga de
 * donde venga: el estudiante las busca en un solo sitio. Lo que las separa del
 * catálogo es quién las puso y que llevan nota, así que conservan su propia
 * sección en vez de mezclarse con las del temario.
 */
export function GroupActivitiesSection({
  activities,
}: {
  activities: GroupActivitySummary[]
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 pt-16">
      <div className="border-t border-border pt-10">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Actividades del curso
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Las actividades que tu docente asignó para ti.
        </p>
      </div>

      {activities.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Tu curso todavía no tiene actividades publicadas.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activities.map((activity) => (
            <GroupActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </section>
  )
}

function GroupActivityCard({ activity }: { activity: GroupActivitySummary }) {
  const topic = getTopic(activity.topicNumber)
  return (
    <Link
      href={`/terminal?ga=${activity.id}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 ease-out hover:z-10 hover:scale-[1.02] hover:border-amber-500/50 hover:shadow-[0_0_10px_rgba(245,158,11,0.45),0_0_30px_rgba(245,158,11,0.3)]"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
          <Target className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold tracking-tight text-foreground transition-colors group-hover:text-amber-400">
            {activity.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {activity.passed ? (
              <span className={cn(PILL, "border-emerald-500/40 text-emerald-500")}>
                Completada
              </span>
            ) : (
              <span className={cn(PILL, "border-amber-500/40 text-amber-500")}>
                Pendiente
              </span>
            )}
            {activity.lastScore !== null && (
              <span className={cn(PILL, "border-sky-500/40 text-sky-400")}>
                Nota: {activity.lastScore}/100
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {activity.description || "Sin instrucciones."}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
          {topic ? `${topic.number}. ${topic.title}` : "Sin tema"}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          <ListChecks className="h-3 w-3" />
          {activity.checksCount} comprobaciones
        </span>
      </div>
    </Link>
  )
}
