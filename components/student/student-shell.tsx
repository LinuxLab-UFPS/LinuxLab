import { SiteHeader } from "@/components/student/site-header"
import { getSearchIndex } from "@/lib/features/shared/lessons"
import { getSimulators } from "@/lib/features/shared/simulators"

/**
 * Shell for the student experience: a black top header instead of the left
 * sidebar. Fills the viewport (header fixed on top, content scrolls below) so
 * full-height pages like the terminal keep working.
 */
export function StudentShell({ children }: { children: React.ReactNode }) {
  const simulators = getSimulators()
  const searchItems = getSearchIndex()
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <SiteHeader simulators={simulators} searchItems={searchItems} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
