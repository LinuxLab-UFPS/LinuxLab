import { GroupActivityCard } from "@/components/student/group-activity-card"
import type { GroupActivitySummary } from "@/lib/features/student/group-activities"

/**
 * Las actividades que el docente publicó para el curso, en la vista general.
 *
 * Van primero (antes del banco del temario): son las que el docente asignó y
 * las que llevan nota. «Mi Grupo» también las lista, en su propia vista.
 */
export function GroupActivitiesSection({
  activities,
}: {
  activities: GroupActivitySummary[]
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 pt-10">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        Actividades del curso
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Las actividades que tu docente asignó para ti.
      </p>

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
