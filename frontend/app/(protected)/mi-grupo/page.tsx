import { Users, GraduationCap } from "lucide-react"
import { GroupActivityCard } from "@/components/student/group-activity-card"
import { listMyGroupActivities } from "@/lib/features/student/group-activities"
import { requireServerRole } from "@/lib/features/auth/session"

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
          El grupo de laboratorio en el que estás matriculado.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        {!group ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h2 className="text-base font-medium text-foreground">Sin grupo de laboratorio</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              No estás inscrito en ningún grupo activo. Cuando un docente te matricule,
              aquí verás tu grupo.
            </p>
          </div>
        ) : (
          <>
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

            {/* Las actividades del curso, aquí mismo: solo las del grupo. */}
            <h3 className="mt-8 mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Actividades del curso ({activities.length})
            </h3>

            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tu curso todavía no tiene actividades publicadas.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {activities.map((activity) => (
                  <GroupActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
