import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { TrackingPanel } from "@/lib/features/teacher/components/tracking-panel"
import { getGroup } from "@/lib/features/teacher/data"
import { getGroupProgress } from "@/lib/features/teacher/data"
import { getTopic } from "@shared/lib/content/temario"
import type { Topic } from "@/lib/features/student/types"
import { requireServerRole } from "@/lib/features/auth/session"

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireServerRole(["teacher", "admin"])
  const { id } = await params
  const [group, summary] = await Promise.all([getGroup(id), getGroupProgress(id)])
  const topics: Topic[] = (group?.enabledTopics ?? [])
    .map(getTopic)
    .filter((t): t is Topic => Boolean(t))
  const groupName = group?.name ?? "Grupo"

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/home">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <nav className="text-xs text-muted-foreground mb-1">
                <Link href="/home" className="hover:text-foreground">
                  Mis Grupos
                </Link>
                <span className="mx-2">/</span>
                <Link href={`/groups/${id}`} className="hover:text-foreground">
                  {groupName}
                </Link>
                <span className="mx-2">/</span>
                <span className="text-foreground">Seguimiento</span>
              </nav>
              <h1 className="text-xl font-semibold">Panel de Seguimiento</h1>
            </div>
          </div>
        </div>
      </div>

      <TrackingPanel groupId={id} summary={summary} topics={topics} />
    </div>
  )
}
