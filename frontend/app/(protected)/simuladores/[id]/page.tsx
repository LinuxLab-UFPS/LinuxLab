import { notFound } from "next/navigation"
import { getSimulator } from "@shared/lib/content/simulators"
import { SimulatorPlayer } from "@/lib/features/student/components/simulator-player"
import { requireServerRole } from "@/lib/features/auth/session"

export default async function SimulatorPlayPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireServerRole(["student"])
  const { id } = await params
  const sim = getSimulator(id)
  if (!sim) notFound()
  return <SimulatorPlayer src={sim.src} title={sim.title} />
}
