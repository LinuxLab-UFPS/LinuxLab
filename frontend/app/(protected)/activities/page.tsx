import { getActivities } from "@/lib/features/shared/activities"
import { ActivityBrowser } from "@/components/student/activity-browser"
import { GroupActivitiesSection } from "@/components/student/group-activities-section"
import { listMyGroupActivities } from "@/lib/features/student/group-activities"
import { requireServerRole } from "@/lib/features/auth/session"

export default async function ActivitiesPage() {
  await requireServerRole(["student", "admin"])

  // Sin grupo (o con el backend caído) la página sigue siendo el catálogo: las
  // del temario no dependen de estar matriculado.
  const { group, activities } = await listMyGroupActivities().catch(() => ({
    group: null,
    activities: [],
  }))

  return (
    <div className="min-h-full pb-24">
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-10">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            Actividades
          </span>
        </h1>
        <span className="mt-3 block h-1 w-24 rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
        <p className="mt-5 text-lg text-muted-foreground">
          Pon en practica lo aprendido con estas actividades y demuestra tus habilidades en la terminal real.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        <ActivityBrowser activities={getActivities()} />
      </section>

      {group && <GroupActivitiesSection activities={activities} />}
    </div>
  )
}
