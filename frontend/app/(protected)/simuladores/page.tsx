import { getSimulators } from "@shared/lib/content/simulators"
import { SimulatorCard } from "@/lib/features/student/components/simulator-card"
import { requireServerRole } from "@/lib/features/auth/session"
import { TituloDeSeccion } from "@shared/components/titulo-de-seccion"

export default async function SimulatorsPage() {
  await requireServerRole(["student", "teacher", "admin"])
  const simulators = getSimulators()

  return (
    <div className="min-h-full pb-24">
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-12">
        <TituloDeSeccion>Simuladores</TituloDeSeccion>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Aprende haciendo: practica en entornos interactivos donde exploras,
          ejecutas comandos y resuelves retos, sin miedo a romper nada.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        {simulators.length === 0 ? (
          <p className="text-muted-foreground">Aún no hay simuladores disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {simulators.map((sim) => (
              <SimulatorCard key={sim.id} simulator={sim} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
