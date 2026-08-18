import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { MyGradesPanel } from "@/lib/features/student/components/my-grades-panel"
import { getMyGrades } from "@/lib/features/student/group-activities"
import { requireServerRole } from "@/lib/features/auth/session"
import { EMPTY_MY_GRADES } from "@/lib/models/groups"

export default async function MyGradesPage() {
  await requireServerRole(["student", "admin"])
  const grades = await getMyGrades().catch(() => EMPTY_MY_GRADES)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/home">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <nav className="mb-1 text-xs text-muted-foreground">
                <Link href="/home" className="hover:text-foreground">
                  Inicio
                </Link>
                <span className="mx-2">/</span>
                <span className="text-foreground">Mis calificaciones</span>
              </nav>
              <h1 className="text-xl font-semibold">Mis Calificaciones</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <MyGradesPanel grades={grades} />
      </div>
    </div>
  )
}
