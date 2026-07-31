"use client"

import { Users, Target, BookOpen } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TablePanel,
  TableEmptyState,
  TableSectionHeader,
  TableSectionLink,
} from "@/components/shared/data-table"
import { NeonProgress } from "@/components/shared/neon-progress"
import { cn } from "@/lib/utils"
import type { AuditEntry, Group, GroupProgressSummary } from "@/lib/features/teacher/types"

/** La actividad reciente se corta en 3 para quedar a la misma altura que el
 *  panel de información general, que tiene tres métricas. */
const ACTIVITY_ROWS = 3

/** Cuántos estudiantes se listan antes de mandar al usuario a "Ver más". */
const TRACKING_ROWS = 5

type Tone = "primary" | "amber" | "sky"

/**
 * Un tono por métrica, con el mismo lenguaje que las actividades sugeridas de
 * la terminal: cuadro de color a la izquierda, borde transparente que se pinta
 * en hover y el texto que toma el color al pasar por encima.
 */
const TONE: Record<Tone, { box: string; hover: string; value: string }> = {
  primary: {
    box: "bg-primary/10 text-primary",
    hover: "hover:border-primary/40 hover:bg-primary/5 group-hover:text-primary",
    value: "text-primary",
  },
  amber: {
    box: "bg-amber-500/10 text-amber-500",
    hover: "hover:border-amber-500/40 hover:bg-amber-500/5 group-hover:text-amber-500",
    value: "text-amber-500",
  },
  sky: {
    box: "bg-sky-500/10 text-sky-500",
    hover: "hover:border-sky-500/40 hover:bg-sky-500/5 group-hover:text-sky-500",
    value: "text-sky-500",
  },
}

function StatButton({
  tone,
  icon: Icon,
  value,
  label,
}: {
  tone: Tone
  icon: React.ComponentType<{ className?: string }>
  value: number
  label: string
}) {
  const t = TONE[tone]
  return (
    <button
      type="button"
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg border border-transparent p-2.5 text-left transition-colors",
        t.hover,
      )}
    >
      <span
        className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", t.box)}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className={cn("block font-mono text-xl font-semibold leading-tight", t.value)}>
          {value}
        </span>
        <span className="block text-xs text-muted-foreground">{label}</span>
      </span>
    </button>
  )
}

/** Panel izquierdo: las tres métricas del curso de un vistazo. */
export function GeneralInfoPanel({ group }: { group: Group }) {
  return (
    <section>
      <TableSectionHeader title="Información general" />
      {/* Sin fondo: solo el marco, para que las tres métricas se lean sobre el
          mismo lienzo de la página y no como otra tabla más. */}
      <div className="space-y-1.5 rounded-xl border border-table-line p-3">
        <StatButton
          tone="primary"
          icon={Users}
          value={group.studentCount}
          label="Estudiantes activos"
        />
        <StatButton
          tone="amber"
          icon={Target}
          value={group.activityCount}
          label="Actividades habilitadas"
        />
        <StatButton
          tone="sky"
          icon={BookOpen}
          value={group.enabledTopics.length}
          label="Módulos activos"
        />
      </div>
    </section>
  )
}

/** Bitácora acotada al curso: lo último que hicieron sus estudiantes. */
export function RecentCourseActivity({ entries }: { entries: AuditEntry[] }) {
  return (
    <section>
      <TableSectionHeader
        title="Actividad reciente del curso"
        action={<TableSectionLink href="/audit-log">Ver más</TableSectionLink>}
      />
      <TablePanel>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-40">Fecha</TableHead>
              <TableHead>Estudiante</TableHead>
              <TableHead className="w-56">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.slice(0, ACTIVITY_ROWS).map((entry) => {
              const date = new Date(entry.timestamp)
              return (
                <TableRow key={entry.id}>
                  <TableCell>
                    <span className="block font-mono text-sm text-foreground">
                      {date.toLocaleTimeString("es-CO")}
                    </span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {date.toLocaleDateString("es-CO")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-sm font-medium text-foreground">
                      {entry.userName}
                    </span>
                    <span className="block text-xs text-muted-foreground">{entry.email}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-sm text-foreground">{entry.action}</span>
                    {entry.target && (
                      <span className="block text-xs font-medium text-amber-500">
                        {entry.target}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {entries.length === 0 && (
          <TableEmptyState>Este curso aún no registra actividad.</TableEmptyState>
        )}
      </TablePanel>
    </section>
  )
}

/** Cómo va cada estudiante: avance, entregas, promedio y última conexión. */
export function TrackingSummary({
  groupId,
  summary,
}: {
  groupId: string
  summary: GroupProgressSummary
}) {
  return (
    <section>
      <TableSectionHeader
        title="Panel de seguimiento"
        action={<TableSectionLink href={`/groups/${groupId}/tracking`}>Ver más</TableSectionLink>}
      />
      <TablePanel>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Estudiante</TableHead>
              <TableHead className="w-40">Progreso</TableHead>
              <TableHead className="w-32">Actividades</TableHead>
              <TableHead className="w-28">Promedio</TableHead>
              <TableHead className="w-44">Última conexión</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.rows.slice(0, TRACKING_ROWS).map((row) => (
              <TableRow key={row.student.id}>
                <TableCell>
                  <span className="block text-sm font-medium text-foreground">
                    {row.student.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">{row.student.email}</span>
                </TableCell>
                <TableCell>
                  <NeonProgress value={row.progress} className="w-28" />
                  <span className="mt-1 block font-mono text-xs text-primary">
                    {row.progress}%
                  </span>
                </TableCell>
                <TableCell className="font-mono text-sm text-amber-500">
                  {row.activitiesDone ?? 0}/{row.activitiesTotal ?? 0}
                </TableCell>
                <TableCell className="font-mono text-sm text-success">
                  {row.averageScore?.toFixed(1) ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.lastActivity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {summary.rows.length === 0 && (
          <TableEmptyState>No hay estudiantes inscritos en este curso.</TableEmptyState>
        )}
      </TablePanel>
    </section>
  )
}
