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
  FileSpreadsheet,
} from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { RoleGuard } from "@shared/components/role-guard"
import { StatTabs } from "@shared/components/stat-tabs"
import { ActionButton } from "@shared/components/action-button"
import { downloadExcel } from "@shared/lib/excel"
import { slugify } from "@shared/lib/utils"
import { GroupStudents } from "@/lib/features/teacher/components/group-students"
import { AddStudentDialog } from "@/lib/features/teacher/components/add-student-dialog"
import { Input } from "@shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import { GroupActivities } from "@/lib/features/teacher/components/group-activities"
import { GradebookPanel } from "@/lib/features/teacher/components/gradebook-panel"
import { buildGradebookSheet } from "@/lib/features/teacher/export/gradebook-export"
import { addStudent } from "@/lib/features/teacher/data"
import { queryKeys, useGradebook, useGroup, useGroupActivities, useGroupStudents } from "@/lib/api/queries"
import type { ActivityType } from "@/lib/features/teacher/types"
import type { EnrollmentStudent } from "@/lib/models/auth"
import { notify } from "@shared/lib/toast"

type Tab = "estudiantes" | "actividades" | "calificaciones"

function GroupDetailContent() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params?.id ?? ""
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) || "estudiantes")
  const [query, setQuery] = useState("")
  const [adding, setAdding] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [activityTypeFilter, setActivityTypeFilter] = useState<"all" | ActivityType>("all")
  const [evalFilter, setEvalFilter] = useState<"all" | "automatic" | "manual">("all")

  const groupQuery = useGroup(id)
  const studentsQuery = useGroupStudents(id)
  const activitiesQuery = useGroupActivities(id)
  const gradebookQuery = useGradebook(id)

  // Hay algo exportable cuando existen actividades con al menos un promedio
  // calculado (algún estudiante con nota o vencida).
  const hasGrades =
    (gradebookQuery.data?.activities.length ?? 0) > 0 &&
    Object.values(gradebookQuery.data?.activityAverages ?? {}).some((value) => value != null)

  const handleExport = async () => {
    if (!gradebookQuery.data) return
    setExporting(true)
    try {
      await downloadExcel({
        fileName: `calificaciones-${slugify(group?.name ?? "curso")}.xlsx`,
        sheets: [buildGradebookSheet(gradebookQuery.data)],
      })
      notify.success("Excel generado", {
        description: "Se descargó el cuaderno de calificaciones.",
      })
    } catch (e) {
      notify.error(e, "No se pudo exportar el cuaderno")
    } finally {
      setExporting(false)
    }
  }

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
      queryClient.invalidateQueries({ queryKey: queryKeys.gradebook(id) })
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

      {/* Tabs */}
      <div className="mb-4">
        <StatTabs
          plain
          value={tab}
          onChange={(v) => {
            setTab(v as Tab)
            router.push(`/groups/${id}?tab=${v}`, { scroll: false })
          }}
          tabs={[
            {
              value: "estudiantes",
              label: "Estudiantes",
              icon: Users,
              tone: "primary",
            },
            {
              value: "actividades",
              label: "Actividades",
              icon: Target,
              tone: "primary",
            },
            {
              value: "calificaciones",
              label: "Calificaciones",
              icon: BarChart3,
              tone: "primary",
            },
          ]}
        />
      </div>

      {/* Header del tab: titulo, busqueda y acciones */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 className="text-base font-semibold text-foreground">
          {tab === "estudiantes"
            ? `Estudiantes del curso (${group.studentCount})`
            : tab === "actividades"
              ? `Actividades del curso (${group.activityCount})`
              : "Calificaciones del curso"}
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={
                tab === "estudiantes"
                  ? "Buscar estudiante por nombre o código..."
                  : tab === "actividades"
                    ? "Buscar actividad por nombre..."
                    : "Buscar por nombre o código..."
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-table-line pl-9"
            />
          </div>

          {tab === "actividades" && (
            <>
              <Select
                value={activityTypeFilter}
                onValueChange={(v) => setActivityTypeFilter(v as "all" | ActivityType)}
              >
                <SelectTrigger className="w-auto border-table-line">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="workshop">Taller</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={evalFilter}
                onValueChange={(v) => setEvalFilter(v as "all" | "automatic" | "manual")}
              >
                <SelectTrigger className="w-auto border-table-line">
                  <SelectValue placeholder="Evaluación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="automatic">Automática</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          {!group.archived &&
            (tab === "estudiantes" ? (
              <ActionButton tone="primary" onClick={() => setAdding(true)}>
                <Plus className="h-4 w-4" />
                Agregar estudiante
              </ActionButton>
            ) : tab === "actividades" ? (
              <ActionButton tone="primary" href={`/groups/${id}/new-activity`}>
                <Plus className="h-4 w-4" />
                Agregar actividad
              </ActionButton>
            ) : (
              <ActionButton
                tone="primary"
                type="button"
                disabled={!hasGrades || exporting}
                onClick={handleExport}
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                {exporting ? "Generando…" : "Exportar Excel"}
              </ActionButton>
            ))}
        </div>
      </div>

      {/* Tabla */}
      {tab === "estudiantes" ? (
        <GroupStudents students={studentsQuery.data ?? []} query={query} />
      ) : tab === "actividades" ? (
        <div data-section="actividades">
          <GroupActivities
            activities={activitiesQuery.data ?? []}
            query={query}
            groupId={id}
            activityTypeFilter={activityTypeFilter}
            evalFilter={evalFilter}
          />
        </div>
      ) : (
        <div data-section="calificaciones">
          <GradebookPanel groupId={id} query={query} />
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
