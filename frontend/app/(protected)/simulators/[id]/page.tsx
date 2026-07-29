import { notFound } from "next/navigation"
import { getSimulator } from "@/lib/features/shared/simulators"
import { SimulatorPlayer } from "@/components/student/simulator-player"
import { requireServerRole } from "@/lib/features/auth/session"

export default async function SimulatorPlayPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireServerRole(["student", "admin"])
  const { id } = await params
  const sim = getSimulator(id)
  if (!sim) notFound()
  return <SimulatorPlayer src={sim.src} title={sim.title} />
}
