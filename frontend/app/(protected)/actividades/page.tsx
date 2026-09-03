import { getActivities } from "@shared/lib/content/activities"
import { ActivityBrowser } from "@/lib/features/student/components/activity-browser"
import { listMyGroupActivities } from "@/lib/features/student/group-activities"
import { requireServerRole } from "@/lib/features/auth/session"

export default async function ActivitiesPage() {
  await requireServerRole(["student"])

  // Sin grupo (o con el backend caído) la página sigue siendo el catálogo: las
  // del temario no dependen de estar matriculado.
  const { activities } = await listMyGroupActivities().catch(() => ({ activities: [] }))

  return (
    <div className="min-h-full pb-24">
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-8">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-[#ff5470] via-[#f43f5e] to-[#C41E3A] bg-clip-text text-transparent">
            Actividades
          </span>
        </h1>
        <span className="mt-3 block h-1 w-24 rounded-full bg-gradient-to-r from-[#ff5470] to-[#C41E3A]" />
        <p className="mt-5 text-lg text-muted-foreground">
          Pon en practica lo aprendido con estas actividades y demuestra tus habilidades en la terminal real.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        {/* Una sola lista: las del temario y las que publicó el docente para el
            grupo, ordenadas por tema. Sin grupo solo aparecen las del temario. */}
        <ActivityBrowser activities={getActivities()} groupActivities={activities} />
      </section>
    </div>
  )
}
