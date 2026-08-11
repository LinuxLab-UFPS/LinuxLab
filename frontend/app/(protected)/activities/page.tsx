import { getActivities } from "@/lib/features/shared/activities"
import { ActivityBrowser } from "@/components/student/activity-browser"
import { requireServerRole } from "@/lib/features/auth/session"

export default async function ActivitiesPage() {
  await requireServerRole(["student", "admin"])

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
    </div>
  )
}
