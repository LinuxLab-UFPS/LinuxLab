"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  CircleDashed,
  Target,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RoleGuard } from "@/components/shared/role-guard"
import { StatTabs } from "@/components/shared/stat-tabs"
import { ActionButton } from "@/components/shared/action-button"
import { GroupStudents } from "@/components/teacher/group-students"
import { GroupActivities } from "@/components/teacher/group-activities"
import {
  getGroup,
  getGroupProgress,
  listGroupActivities,
  listStudents,
} from "@/lib/features/teacher/data"
import type { Activity, Group, GroupProgressSummary } from "@/lib/features/teacher/types"
import type { EnrollmentStudent } from "@/lib/features/auth/types"

const EMPTY_PROGRESS: GroupProgressSummary = {
  enrolledCount: 0,
  averageProgress: 0,
  completedToday: 0,
  activeNow: 0,
  rows: [],
}

type Tab = "estudiantes" | "actividades"

function GroupDetailContent() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ""
  const [tab, setTab] = useState<Tab>("estudiantes")

  const [group, setGroup] = useState<Group | null>(null)
  const [progress, setProgress] = useState<GroupProgressSummary>(EMPTY_PROGRESS)
  const [activities, setActivities] = useState<Activity[]>([])
  const [students, setStudents] = useState<EnrollmentStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      getGroup(id),
      getGroupProgress(id),
      listGroupActivities(id),
      listStudents(id),
    ])
      .then(([g, prog, acts, enrolled]) => {
        setGroup(g)
        setProgress(prog)
        setActivities(acts)
        setStudents(enrolled)
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error al cargar el curso"))
      .finally(() => setLoading(false))
  }, [id])

  // Las cuentas se crean en segundo plano: mientras alguna falte, se refresca.
  useEffect(() => {
    if (!id || students.length === 0) return
    if (students.every((s) => s.linuxProvisioned)) return
    const interval = setInterval(() => {
      listStudents(id).then(setStudents).catch(() => {})
    }, 5000)
    return () => clearInterval(interval)
  }, [id, students])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/60">
          <BookOpen className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="mb-1 text-base font-medium text-foreground">Curso no encontrado</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {error || "Este curso no existe o aún no tiene datos."}
        </p>
        <Link href="/home">
          <Button variant="outline">Volver a Cursos</Button>
        </Link>
      </div>
    )
  }

  return (
    <div data-section="cursos" className="mx-auto max-w-6xl px-6 py-8">
      <ActionButton tone="neutral" href="/home">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </ActionButton>

      <div className="mb-7 mt-9">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {group.name}
          </h1>
          {/* Desactivar no tiene vuelta atrás, así que el resumen de un curso
              desactivado es solo el histórico de lo que alcanzó a pasar. */}
          {group.archived && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500">
              Desactivado
            </span>
          )}
        </div>
        {group.description && (
          // Una sola linea: si la descripcion es larga se recorta con puntos
          // suspensivos en vez de empujar el resto del resumen hacia abajo.
          <p className="mt-1 truncate text-sm text-muted-foreground">{group.description}</p>
        )}
      </div>

      <StatTabs
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        tabs={[
          {
            value: "estudiantes",
            label: "Estudiantes",
            statLabel: "Estudiantes totales",
            count: group.studentCount,
            icon: Users,
            tone: "primary",
          },
          {
            value: "actividades",
            label: "Actividades",
            statLabel: "Actividades totales",
            count: group.activityCount,
            icon: Target,
            tone: "amber",
          },
        ]}
      />

      {tab === "estudiantes" && (
        <div className="mt-6">
          <GroupStudents
            groupId={id}
            students={students}
            summary={progress}
            archived={group.archived}
          />
        </div>
      )}

      {/* La sección de actividades va en ámbar: paginación y controles la siguen. */}
      {tab === "actividades" && (
        <div data-section="actividades" className="mt-6">
          <GroupActivities activities={activities} archived={group.archived} />
        </div>
      )}
    </div>
  )
}

export default function GroupDetailPage() {
  return (
    <RoleGuard roles={["teacher", "admin"]}>
      <GroupDetailContent />
    </RoleGuard>
  )
}
