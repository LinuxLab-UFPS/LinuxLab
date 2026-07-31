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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RoleGuard } from "@/components/shared/role-guard"
import {
  GeneralInfoPanel,
  RecentCourseActivity,
  TrackingSummary,
} from "@/components/teacher/group-summary"
import {
  getGroup,
  getGroupProgress,
  listGroupAuditLog,
  listProvisioningJobs,
} from "@/lib/features/teacher/data"
import type {
  Group,
  GroupProgressSummary,
  AuditEntry,
  ProvisioningJobSummary,
} from "@/lib/features/teacher/types"

const EMPTY_PROGRESS: GroupProgressSummary = {
  enrolledCount: 0,
  averageProgress: 0,
  completedToday: 0,
  activeNow: 0,
  rows: [],
}

function GroupDetailContent() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ""

  const [group, setGroup] = useState<Group | null>(null)
  const [progress, setProgress] = useState<GroupProgressSummary>(EMPTY_PROGRESS)
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [provisioningJobs, setProvisioningJobs] = useState<ProvisioningJobSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      getGroup(id),
      getGroupProgress(id),
      listGroupAuditLog(id),
      listProvisioningJobs(id),
    ])
      .then(([g, prog, entries, jobs]) => {
        setGroup(g)
        setProgress(prog)
        setAuditEntries(entries)
        setProvisioningJobs(jobs)
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error al cargar el curso"))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || !provisioningJobs.length) return
    const hasPending = provisioningJobs.some((j) => j.status !== "completed" && j.status !== "failed")
    if (!hasPending) return
    const interval = setInterval(() => {
      listProvisioningJobs(id).then(setProvisioningJobs).catch(() => {})
    }, 5000)
    return () => clearInterval(interval)
  }, [id, provisioningJobs.length])

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
      <Link
        href="/home"
        className="neon-glow inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <div className="mb-7 mt-9">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {group.name}
        </h1>
        {group.description && (
          // Una sola linea: si la descripcion es larga se recorta con puntos
          // suspensivos en vez de empujar el resto del resumen hacia abajo.
          <p className="mt-1 truncate text-sm text-muted-foreground">{group.description}</p>
        )}
      </div>

      {/* La info general va estrecha a la izquierda y la bitácora del curso se
          queda con el resto del ancho, que es la que tiene columnas largas. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
        <GeneralInfoPanel group={group} />
        <RecentCourseActivity entries={auditEntries} />
      </div>

      <div className="mt-6">
        <TrackingSummary groupId={id} summary={progress} />
      </div>

      {provisioningJobs.length > 0 && (
        <div className="mt-6">
          <ProvisioningPanel jobs={provisioningJobs} />
        </div>
      )}
    </div>
  )
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; style: string }
> = {
  completed: {
    label: "Listo",
    icon: CheckCircle2,
    style: "text-success bg-success/10 border-success/30",
  },
  processing: {
    label: "Creando...",
    icon: Clock,
    style: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  },
  pending: {
    label: "En cola",
    icon: CircleDashed,
    style: "text-muted-foreground bg-secondary border-table-line",
  },
  failed: {
    label: "Error",
    icon: AlertCircle,
    style: "text-danger bg-danger/10 border-danger/30",
  },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return null
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        cfg.style,
      )}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

/** Estado del aprovisionamiento de cuentas Linux, solo mientras haya trabajos. */
function ProvisioningPanel({ jobs }: { jobs: ProvisioningJobSummary[] }) {
  const completed = jobs.filter((j) => j.status === "completed").length
  const failed = jobs.filter((j) => j.status === "failed").length
  const pending = jobs.filter((j) => j.status !== "completed" && j.status !== "failed").length

  return (
    <div className="rounded-xl border border-table-line bg-table-surface">
      <div className="flex items-center justify-between gap-4 border-b border-table-line px-5 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Cuentas Linux
        </h2>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-success">{completed} listas</span>
          {pending > 0 && <span className="text-amber-500">{pending} pendientes</span>}
          {failed > 0 && <span className="text-danger">{failed} con error</span>}
        </div>
      </div>
      <div className="max-h-56 overflow-y-auto">
        {jobs.slice(0, 50).map((job) => (
          <div
            key={job.id}
            className="flex items-center justify-between gap-4 border-b border-table-line px-5 py-2.5 last:border-0"
          >
            <span className="text-sm text-foreground">{job.student.name}</span>
            <span className="font-mono text-xs text-muted-foreground">{job.username || "—"}</span>
            <StatusBadge status={job.status} />
          </div>
        ))}
      </div>
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
