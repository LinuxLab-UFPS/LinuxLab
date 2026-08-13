import Link from "next/link"
import { Users, GraduationCap, ListChecks, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { listMyGroupActivities } from "@/lib/features/student/group-activities"
import { getTopic } from "@/lib/features/shared/temario"
import { requireServerRole } from "@/lib/features/auth/session"

const PILL = "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"

export default async function MyGroupPage() {
  await requireServerRole(["student", "admin"])
  const { group, activities } = await listMyGroupActivities().catch(() => ({
    group: null,
    activities: [],
  }))

  return (
    <div className="min-h-full pb-24">
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-10">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            Mi Grupo
          </span>
        </h1>
        <span className="mt-3 block h-1 w-24 rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
        <p className="mt-5 text-lg text-muted-foreground">
          Tu grupo de laboratorio y las actividades que el docente preparó para el curso.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        {!group ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h2 className="text-base font-medium text-foreground">Sin grupo de laboratorio</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              No estás inscrito en ningún grupo activo. Cuando un docente te matricule,
              aquí verás tu grupo y sus actividades.
            </p>
          </div>
        ) : (
          <>
            {/* Grupo */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <Users className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold tracking-tight text-foreground">{group.name}</h2>
                  {group.description && (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {group.description}
                    </p>
                  )}
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4 shrink-0" />
                    Docente: <span className="font-medium text-foreground">{group.teacherName}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Actividades del curso */}
            <h3 className="mt-8 mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Actividades del curso ({activities.length})
            </h3>

            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este curso todavía no tiene actividades publicadas.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {activities.map((activity) => {
                  const topic = getTopic(activity.topicNumber)
                  return (
                    <Link
                      key={activity.id}
                      href={`/terminal?ga=${activity.id}`}
                      className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 ease-out hover:z-10 hover:scale-[1.02] hover:border-amber-500/50 hover:shadow-[0_0_10px_rgba(245,158,11,0.45),0_0_30px_rgba(245,158,11,0.3)]"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                          <Target className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold tracking-tight text-foreground transition-colors group-hover:text-amber-400">
                            {activity.title}
                          </h4>
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
                })}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
