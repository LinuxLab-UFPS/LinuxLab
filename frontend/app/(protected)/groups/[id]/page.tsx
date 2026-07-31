"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ChevronLeft,
  Users,
  BookOpen,
  Plus,
  BarChart3,
  Settings,
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  CircleDashed,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RoleGuard } from "@/components/shared/role-guard"
import { getGroup, listGroupActivities, listProvisioningJobs } from "@/lib/features/teacher/data"
import { getTopic } from "@/lib/features/shared/temario"
import type { Group, ProvisioningJobSummary } from "@/lib/features/teacher/types"
import type { Activity } from "@/lib/features/teacher/types"

function GroupDetailContent() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ""

  const [group, setGroup] = useState<Group | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [provisioningJobs, setProvisioningJobs] = useState<ProvisioningJobSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([getGroup(id), listGroupActivities(id), listProvisioningJobs(id)])
      .then(([g, acts, jobs]) => {
        setGroup(g)
        setActivities(acts)
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="min-h-screen">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
          <div className="px-6 py-4">
            <Link href="/home">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="max-w-md mx-auto text-center py-24">
          <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-secondary/60 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="text-base font-medium text-foreground mb-1">Curso no encontrado</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {error || "Este curso no existe o aún no tiene datos."}
          </p>
          <Link href="/home">
            <Button variant="outline">Volver a Cursos</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
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
                  <span className="text-foreground">{group.name}</span>
                </nav>
                <h1 className="text-xl font-semibold">{group.name}</h1>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-border">
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard icon={Users} value={group.studentCount} label="Estudiantes" accent />
          <StatCard icon={BookOpen} value={group.enabledTopics.length} label="Temas activos" />
          <StatCard icon={FileText} value={group.activityCount} label="Actividades" />
          <div className="bg-card border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-success/10 flex items-center justify-center">
              <div className="w-3 h-3 bg-success rounded-full" />
            </div>
            <div>
              <span className="text-2xl font-semibold font-mono text-success">
                {group.archived ? "Archivado" : "Activo"}
              </span>
              <span className="block text-xs text-muted-foreground">Estado</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <QuickAction
            href={`/groups/${id}/tracking`}
            icon={BarChart3}
            title="Panel de Seguimiento"
            description="Ver progreso de estudiantes"
          />
          <QuickAction
            href={`/groups/${id}/new-activity`}
            icon={Plus}
            title="Nueva Actividad"
            description="Crear actividad personalizada"
          />
        </div>

        {/* Provisioning Status */}
        {provisioningJobs.length > 0 && (
          <div className="bg-card border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">Cuentas Linux</h2>
              <div className="flex items-center gap-3 text-xs">
                {(() => {
                  const completed = provisioningJobs.filter((j) => j.status === "completed").length
                  const failed = provisioningJobs.filter((j) => j.status === "failed").length
                  const pending = provisioningJobs.filter((j) => j.status !== "completed" && j.status !== "failed").length
                  return (
                    <>
                      <span className="text-green-600">{completed} listas</span>
                      {pending > 0 && <span className="text-amber-600">{pending} pendientes</span>}
                      {failed > 0 && <span className="text-red-600">{failed} con error</span>}
                    </>
                  )
                })()}
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {provisioningJobs.slice(0, 50).map((job) => (
                <div key={job.id} className="flex items-center justify-between text-sm py-1 border-b border-border/30 last:border-0">
                  <span className="text-foreground">{job.student.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{job.username || "—"}</span>
                  <StatusBadge status={job.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div className="bg-card border border-border">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-medium">Actividades Recientes</h2>
          </div>
          {activities.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              Este grupo aún no tiene actividades.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">{activity.title}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {getTopic(activity.topicNumber)?.title ?? ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Group Description */}
        <div className="bg-card border border-border p-4">
          <h2 className="font-medium mb-2">Descripción del curso</h2>
          <p className="text-sm text-muted-foreground">{group.description}</p>
        </div>
      </div>
    </div>
  )
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; style: string }> = {
  completed: { label: "Listo", icon: CheckCircle2, style: "text-green-600 bg-green-500/10 border-green-500/20" },
  processing: { label: "Creando...", icon: Clock, style: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
  pending: { label: "En cola", icon: CircleDashed, style: "text-muted-foreground bg-secondary border-border" },
  failed: { label: "Error", icon: AlertCircle, style: "text-red-600 bg-red-500/10 border-red-500/20" },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return null
  const Icon = cfg.icon
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border", cfg.style)}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

function StatCard({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: number
  label: string
  accent?: boolean
}) {
  return (
    <div className="bg-card border border-border p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 flex items-center justify-center ${
          accent ? "bg-primary/10" : "bg-secondary/50"
        }`}
      >
        <Icon className={`w-5 h-5 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div>
        <span className="text-2xl font-semibold font-mono">{value}</span>
        <span className="block text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="bg-card border border-border p-6 hover:border-primary/30 transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-medium group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Link>
  )
}

export default function GroupDetailPage() {
  return (
    <RoleGuard roles={["teacher", "admin"]}>
      <GroupDetailContent />
    </RoleGuard>
  )
}
