import { getActivities } from "@/lib/features/shared/activities"
import { ActivityCard } from "@/components/student/activity-card"
import { requireServerRole } from "@/lib/features/auth/session"

export default async function ActivitiesPage() {
  await requireServerRole(["student", "admin"])
  const activities = getActivities()

  return (
    <div className="min-h-full pb-24">
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            Actividades
          </span>
        </h1>
        <span className="mt-3 block h-1 w-24 rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Prácticas que se revisan sobre tu propia cuenta del laboratorio. Haz el
          trabajo en la terminal, pulsa comprobar, y el sistema te dice punto por
          punto qué quedó bien y qué falta.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        {activities.length === 0 ? (
          <p className="text-muted-foreground">Aún no hay actividades disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity) => (
              <ActivityCard key={activity.slug} activity={activity} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
