import { getActivities } from "@/lib/features/shared/activities"
import { ActivityGrid } from "@/components/student/activity-grid"
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
          Ponlo en práctica en tu terminal. El laboratorio revisa tu trabajo.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        <ActivityGrid activities={getActivities()} />
      </section>
    </div>
  )
}
