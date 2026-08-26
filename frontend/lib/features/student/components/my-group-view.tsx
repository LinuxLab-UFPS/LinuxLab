"use client"

import { Users, GraduationCap, Target, BarChart3 } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { StatTabs } from "@shared/components/stat-tabs"
import { GroupActivityCard } from "@/lib/features/student/components/group-activity-card"
import { MyGradesPanel } from "@/lib/features/student/components/my-grades-panel"
import type { GroupActivitySummary, MyGroup } from "@/lib/models/activities"
import type { MyGrades } from "@/lib/models/groups"

type Tab = "actividades" | "calificaciones"

/**
 * Vista "Mi Grupo": el grupo del estudiante en el mismo layout tabulado que
 * usa el docente para un curso. "Actividades" lista las del curso y
 * "Mis calificaciones" muestra el boletin con sus graficas.
 */
export function MyGroupView({
  group,
  activities,
  grades,
}: {
  group: MyGroup | null
  activities: GroupActivitySummary[]
  grades: MyGrades
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const tab: Tab = (searchParams.get("tab") as Tab) || "actividades"

  const setTab = (value: string) => {
    router.push(`${pathname}?tab=${value}`, { scroll: false })
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-[#ff5470] via-[#f43f5e] to-[#C41E3A] bg-clip-text text-transparent">
            Mi Grupo
          </span>
        </h1>
        <span className="mt-3 block h-1 w-24 rounded-full bg-gradient-to-r from-[#ff5470] to-[#C41E3A]" />
        <p className="mt-4 text-lg text-muted-foreground">
          El grupo de laboratorio en el que estás matriculado y tus calificaciones.
        </p>
      </div>

      <div className="mb-6">
        <StatTabs
          plain
          value={tab}
          onChange={setTab}
          tabs={[
            {
              value: "actividades",
              label: "Actividades",
              icon: Target,
              tone: "primary",
            },
            {
              value: "calificaciones",
              label: "Mis calificaciones",
              icon: BarChart3,
              tone: "primary",
            },
          ]}
        />
      </div>

      {tab === "actividades" ? (
        !group ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h2 className="text-base font-medium text-foreground">Sin grupo de laboratorio</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              No estás inscrito en ningún grupo activo. Cuando un docente te matricule,
              aquí verás tu grupo.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold tracking-tight text-foreground">{group.name}</h2>
                  {group.description && (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {group.description}
                    </p>
                  )}
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4 shrink-0" />
                    Docente: <span className="font-medium text-foreground">{group.teacherName}</span>
                  </p>
                </div>
              </div>
            </div>

            <h3 className="mt-8 mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Actividades del curso ({activities.length})
            </h3>

            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tu curso todavía no tiene actividades publicadas.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {activities.map((activity) => (
                  <GroupActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </>
        )
      ) : (
        <MyGradesPanel grades={grades} />
      )}
    </div>
  )
}