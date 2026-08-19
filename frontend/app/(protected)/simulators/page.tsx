import { getSimulators } from "@shared/lib/content/simulators"
import { SimulatorCard } from "@/lib/features/student/components/simulator-card"
import { requireServerRole } from "@/lib/features/auth/session"

export default async function SimulatorsPage() {
  await requireServerRole(["student", "admin"])
  const simulators = getSimulators()

  return (
    <div className="min-h-full pb-24">
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-[#ff5470] via-[#f43f5e] to-[#C41E3A] bg-clip-text text-transparent">
            Simuladores
          </span>
        </h1>
        <span className="mt-3 block h-1 w-24 rounded-full bg-gradient-to-r from-[#ff5470] to-[#C41E3A]" />
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
