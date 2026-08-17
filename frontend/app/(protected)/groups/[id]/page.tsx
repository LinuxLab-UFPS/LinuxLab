"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Target,
  Users,
  Plus,
  Search,
  BarChart3,
  Activity,
} from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { RoleGuard } from "@shared/components/role-guard"
import { StatTabs } from "@shared/components/stat-tabs"
import { ActionButton } from "@shared/components/action-button"
import { GroupStudents } from "@/lib/features/teacher/components/group-students"
import { AddStudentDialog } from "@/lib/features/teacher/components/add-student-dialog"
import { Input } from "@shared/components/ui/input"
import { GroupActivities } from "@/lib/features/teacher/components/group-activities"
import { addStudent } from "@/lib/features/teacher/data"
import { queryKeys, useGroup, useGroupActivities, useGroupStudents } from "@/lib/api/queries"
import type { EnrollmentStudent } from "@/lib/models/auth"
import { notify } from "@shared/lib/toast"

type Tab = "estudiantes" | "actividades"

function GroupDetailContent() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params?.id ?? ""
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) || "estudiantes")
  const [query, setQuery] = useState("")
  const [adding, setAdding] = useState(false)

  const groupQuery = useGroup(id)
  const studentsQuery = useGroupStudents(id)
  const activitiesQuery = useGroupActivities(id)

  const group = groupQuery.data ?? null
  const loading = groupQuery.isLoading
  const error = groupQuery.error

  const addStudentMutation = useMutation({
    mutationFn: (student: Omit<EnrollmentStudent, "id">) => addStudent(id, student),
    onSuccess: (created) => {
      queryClient.setQueryData(queryKeys.groupStudents(id), (prev: EnrollmentStudent[] = []) => [
        ...prev,
        created,
      ])
      queryClient.invalidateQueries({ queryKey: queryKeys.group(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups })
      setAdding(false)
      notify.success("Estudiante agregado")
    },
    onError: () => {
      notify.error(null, "No se pudo agregar el estudiante.")
    },
  })

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
          {error instanceof Error ? error.message : "Este curso no existe o aun no tiene datos."}
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

      {/* Titulo + descripcion */}
      <div className="mb-6 mt-9">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {group.name}
          </h1>
          {group.archived && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500">
              Desactivado
            </span>
          )}
        </div>
        {group.description && (
          <p className="mt-1 truncate text-sm text-muted-foreground">{group.description}</p>
        )}
      </div>

      {/* Stat cards estilo admin */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-border px-5 py-4">
          <Users className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-mono text-2xl font-semibold leading-none text-foreground">
              {group.studentCount}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">Estudiantes inscritos</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-border px-5 py-4">
          <Activity className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-mono text-2xl font-semibold leading-none text-foreground">
              {group.activeNow}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">Activos ahora</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-border px-5 py-4">
          <Target className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-mono text-2xl font-semibold leading-none text-foreground">
              {group.activityCount}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">Actividades publicadas</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-border px-5 py-4">
          <BarChart3 className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-mono text-2xl font-semibold leading-none text-foreground">
              {group.averageScore != null ? `${group.averageScore}/100` : "—"}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">Promedio general</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <StatTabs
          value={tab}
          onChange={(v) => {
            setTab(v as Tab)
            router.push(`/groups/${id}?tab=${v}`, { scroll: false })
          }}
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
      </div>

      {/* Search + boton agregar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={
              tab === "estudiantes"
                ? "Buscar estudiante por nombre o correo..."
                : "Buscar actividad por nombre..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-table-line pl-9"
          />
        </div>

        {!group.archived &&
          (tab === "estudiantes" ? (
            <ActionButton tone="primary" className="ml-auto" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" />
              Agregar estudiante
            </ActionButton>
          ) : (
            <ActionButton tone="amber" className="ml-auto" href={`/groups/${id}/new-activity`}>
              <Plus className="h-4 w-4" />
              Agregar actividad
            </ActionButton>
          ))}
      </div>

      {/* Tabla */}
      {tab === "estudiantes" ? (
        <GroupStudents students={studentsQuery.data ?? []} groupId={id} query={query} />
      ) : (
        <div data-section="actividades">
          <GroupActivities activities={activitiesQuery.data ?? []} query={query} groupId={id} />
        </div>
      )}

      <AddStudentDialog
        open={adding}
        busy={addStudentMutation.isPending}
        onSubmit={(student) => addStudentMutation.mutate(student)}
        onOpenChange={setAdding}
      />
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
