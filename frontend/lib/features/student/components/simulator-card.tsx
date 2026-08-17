import type { ComponentType } from "react"
import { BookOpen } from "lucide-react"
import { ContentCard } from "@/lib/features/student/components/content-card"
import {
  SimulatorCompressionIllustration,
  SimulatorPermissionsIllustration,
  SimulatorSearchIllustration,
  SimulatorTreeIllustration,
  SimulatorViIllustration,
} from "@/lib/features/student/components/topic-illustrations"
import type { Simulator } from "@shared/lib/content/simulators"

/** Illustration per simulator id (falls back to the tree one). */
const ILLUSTRATION: Record<string, ComponentType> = {
  "travesia-del-arbol": SimulatorTreeIllustration,
  "retos-de-vi": SimulatorViIllustration,
  "filtro-de-permisos": SimulatorPermissionsIllustration,
  "escritorio-comprimido": SimulatorCompressionIllustration,
  "despliegue-del-viernes": SimulatorSearchIllustration,
}

/** A simulator as a green ContentCard, used on the simulators page and embedded
 *  in lessons. Its single tag is the topic (module) it belongs to. */
export function SimulatorCard({ simulator }: { simulator: Simulator }) {
  return (
    <ContentCard
      href={simulator.href}
      title={simulator.title}
      description={simulator.description}
      illustration={ILLUSTRATION[simulator.id] ?? SimulatorTreeIllustration}
      tags={[
        { icon: BookOpen, label: simulator.topicTitle },
      ]}
      accent="green"
    />
  )
}
