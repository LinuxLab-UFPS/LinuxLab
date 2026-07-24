import type { ComponentType } from "react"
import { BookOpen } from "lucide-react"
import { getSimulators } from "@/lib/features/shared/lessons"
import { ContentCard } from "@/components/student/content-card"
import { SimulatorTreeIllustration } from "@/components/student/topic-illustrations"

/** Per-simulator display data (illustration + blurb), keyed by subtopic id. */
const SIM_META: Record<string, { illustration: ComponentType; description: string }> = {
  simulador: {
    illustration: SimulatorTreeIllustration,
    description:
      "Navega el árbol de directorios de Linux con cd, ls y pwd. Llega al directorio objetivo con retos y modos de juego.",
  },
}

export default function SimulatorsPage() {
  const simulators = getSimulators()

  return (
    <div className="min-h-full pb-24">
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            Simuladores
          </span>
        </h1>
        <span className="mt-3 block h-1 w-24 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
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
            {simulators.map((sim) => {
              const meta = SIM_META[sim.id]
              return (
                <ContentCard
                  key={`${sim.topicSlug}/${sim.id}`}
                  href={sim.href}
                  title={sim.title}
                  description={meta?.description}
                  illustration={meta?.illustration ?? SimulatorTreeIllustration}
                  tags={[
                    {
                      icon: BookOpen,
                      label: sim.topicTitle,
                      className:
                        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    },
                  ]}
                  accent="green"
                />
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
