import { getActivities } from "@shared/lib/content/activities"
import { ActivityBrowser } from "@/lib/features/student/components/activity-browser"
import { listMyGroupActivities } from "@/lib/features/student/group-activities"
import { requireServerRole } from "@/lib/features/auth/session"
import { TituloDeSeccion } from "@shared/components/titulo-de-seccion"

export default async function ActivitiesPage() {
  await requireServerRole(["student"])

  // Sin grupo (o con el backend caído) la página sigue siendo el catálogo: las
  // del temario no dependen de estar matriculado.
  const { activities } = await listMyGroupActivities().catch(() => ({ activities: [] }))

  return (
    <div className="min-h-full pb-24">
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-8">
        <TituloDeSeccion>Actividades</TituloDeSeccion>
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
