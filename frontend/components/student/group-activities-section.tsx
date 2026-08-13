import { GroupActivityCard } from "@/components/student/group-activity-card"
import type { GroupActivitySummary } from "@/lib/features/student/group-activities"

/**
 * Las actividades que el docente asignó, dentro de la vista de Actividades.
 *
 * Van debajo del buscador y encima del catálogo del temario: son las que llevan
 * nota, pero el buscador es lo primero de la página y no se mueve de ahí. Quien
 * decide si esto se pinta es la página: sin actividades asignadas no hay
 * sección, no una sección vacía.
 */
export function GroupActivitiesSection({
  activities,
}: {
  activities: GroupActivitySummary[]
}) {
  return (
    // La línea de abajo separa lo asignado del catálogo. Va aquí y no en el
    // catálogo para que no exista cuando no hay actividades del curso.
    <section className="mb-10 border-b border-border pb-10">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        Actividades del curso
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Las actividades que tu docente asignó para ti.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {activities.map((activity) => (
          <GroupActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </section>
  )
}
