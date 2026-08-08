import type { ComponentType } from "react"
import { BookOpen } from "lucide-react"
import { ContentCard } from "@/components/student/content-card"
import {
  SimulatorTreeIllustration,
  SimulatorViIllustration,
} from "@/components/student/topic-illustrations"
import type { Simulator } from "@/lib/features/shared/simulators"

/** Illustration per simulator id (falls back to the tree one). */
const ILLUSTRATION: Record<string, ComponentType> = {
  "travesia-del-arbol": SimulatorTreeIllustration,
  "retos-de-vi": SimulatorViIllustration,
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
        {
          icon: BookOpen,
          label: simulator.topicTitle,
          className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        },
      ]}
      accent="green"
    />
  )
}
