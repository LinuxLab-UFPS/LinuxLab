"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { BarChart3, CalendarX, CheckCircle2, Clock3, ListChecks, Radar, TrendingUp, Users } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { getTopic } from "@shared/lib/content/temario"
import { DIFFICULTY_LABEL } from "@shared/lib/content/activities"
import { conOrigen } from "@shared/lib/next-url"
import { GraficaNotas, GraficaTemas } from "@shared/components/charts/grade-charts"
import type { LucideIcon } from "lucide-react"
import type { GradebookCellStatus, GradeSeriesPoint, MyGrades } from "@/lib/models/groups"

/** El nombre del tema desde el temario; sin entrada cae a "Sin tema". */
function topicTitleOf(topicNumber: number): string {
  if (topicNumber === 0) return "Sin tema"
  return getTopic(topicNumber)?.title ?? `Tema ${topicNumber}`
}

/**
 * A donde se resuelve cada actividad: las del temario se abren por su slug y
 * las del docente por su id, siempre junto a la terminal — que es el unico
 * sitio donde se trabajan. El origen viaja en el enlace: el botón de volver de
 * la actividad regresa aquí, a la fila de la que se salió.
 */
function hrefDe(s: GradeSeriesPoint): string {
  const destino =
    s.source === "bank" ? `/terminal?actividad=${s.workdir}` : `/terminal?ga=${s.activityId}`
  return conOrigen(destino, "/estudiante/grupo")
}

const STATUS_META: Record<GradebookCellStatus, { label: string; text: string; dot: string }> = {
  completed: { label: "Completada", text: "text-success", dot: "bg-success" },
  "under-review": { label: "En revisión", text: "text-warning", dot: "bg-warning" },
  overdue: { label: "Vencida", text: "text-danger", dot: "bg-danger" },
  "not-started": { label: "Sin iniciar", text: "text-muted-foreground", dot: "bg-muted-foreground" },
}

/* El resto de la pagina son tarjetas redondeadas que se levantan al pasar por
   encima. Este panel era el unico bloque con esquinas cuadradas y sin sombra,
   metido en una vista cuyo titulo va en degradado rojo: por eso desentonaba. */
const PANEL =
  "rounded-2xl border border-border bg-card p-5 transition-all duration-300 " +
  "hover:border-primary/50 hover:shadow-[var(--neon-glow-strong)]"

/** Cabecera de un bloque: icono en caja roja y titulo, como las demas tarjetas. */
function Cabecera({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0">
        <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}

/**
 * Una cifra suelta. Sustituye al `MetricCard` viejo, que era cuadrado y sin
 * relieve; este panel era su unico consumidor.
 */
function Cifra({
  title,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  title: string
  value: string | number
  icon: LucideIcon
  tone?: "neutral" | "primary" | "warning" | "danger"
}) {
  const color = {
    neutral: "text-foreground",
    primary: "text-primary",
    warning: "text-warning",
    danger: "text-danger",
  }[tone]
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-border bg-card p-4",
        "transition-all duration-300 hover:border-primary/50",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          tone === "primary" ? "bg-primary/10 text-primary" : "bg-secondary/60 text-muted-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className={cn("font-mono text-2xl font-semibold", color)}>{value}</p>
      </div>
    </div>
  )
}

export function MyGradesPanel({ grades }: { grades: MyGrades }) {
  const router = useRouter()

  if (!grades.group) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/60">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="mb-1 text-base font-medium text-foreground">Sin grupo activo</h2>
        <p className="text-sm text-muted-foreground">
          Cuando estés inscrito en un curso, aquí verás tus calificaciones.
        </p>
      </div>
    )
  }

  const { series, topics, summary } = grades
  const pending = summary.underReview

  /* El eje X. Las del docente traen un codigo corto (T-0001); las del temario
     traen su slug, que es una frase entera y no cabe, asi que se recorta. El
     titulo completo sigue en la tabla. */
  const etiqueta = (s: GradeSeriesPoint) =>
    s.source === "bank" && s.workdir.length > 12 ? `${s.workdir.slice(0, 11)}…` : s.workdir

  const lineData = series.map((s) => ({
    name: etiqueta(s),
    propio: s.score,
    grupo: s.groupAverage,
  }))

  const radarData = topics.map((t) => ({
    topic: topicTitleOf(t.topicNumber),
    promedio: t.avgScore ?? 0,
  }))

  return (
    <div className="space-y-6">
      {/* El nombre del curso no se repite aquí: es el título de la vista que
          contiene este panel. */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          title="Definitiva"
          value={summary.average != null ? `${summary.average}/100` : "—"}
          icon={TrendingUp}
          tone="primary"
        />
        <Cifra
          title="Completadas"
          value={`${summary.completed}/${summary.total}`}
          icon={CheckCircle2}
        />
        <Cifra title="En revisión" value={pending} icon={Clock3} tone={pending > 0 ? "warning" : "neutral"} />
        <Cifra
          title="Vencidas"
          value={summary.overdue}
          icon={CalendarX}
          tone={summary.overdue > 0 ? "danger" : "neutral"}
        />
      </div>

      <div className={PANEL}>
        <Cabecera
          icon={BarChart3}
          title="Calificación por actividad"
          hint="Tus notas frente al promedio del curso."
        />
        {lineData.length > 0 ? (
          <GraficaNotas datos={lineData} />
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Aún no hay actividades en tu curso.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className={cn(PANEL, "lg:col-span-2")}>
          <Cabecera icon={Radar} title="Por tema" hint="Dónde vas mejor y dónde flojeas." />
          {radarData.length > 0 ? (
            <GraficaTemas datos={radarData} />
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">Sin datos por tema.</p>
          )}
        </div>

        <div className={cn(PANEL, "lg:col-span-3 p-0")}>
          <div className="p-5 pb-0">
            <Cabecera icon={ListChecks} title="Mis calificaciones" />
          </div>
          <div className="max-h-[22rem] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Actividad
                  </th>
                  <th className="w-28 px-3 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Estado
                  </th>
                  <th className="w-24 px-3 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Nota
                  </th>
                </tr>
              </thead>
              <tbody>
                {series.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      Sin actividades aún.
                    </td>
                  </tr>
                )}
                {series.map((s) => {
                  const meta = STATUS_META[s.status]
                  return (
                    /* La fila entera lleva a la actividad: el cuaderno es el
                       punto de partida natural para retomar lo pendiente. El
                       titulo sigue siendo un `Link` para que la navegación
                       también funcione con teclado y clic derecho. */
                    <tr
                      key={s.activityId}
                      onClick={() => router.push(hrefDe(s))}
                      className="cursor-pointer border-b border-border/50 transition-colors hover:bg-foreground/[0.04]"
                    >
                      <td className="px-5 py-2.5 text-left">
                        <Link
                          href={hrefDe(s)}
                          onClick={(e) => e.stopPropagation()}
                          className="block text-sm font-medium transition-colors hover:text-primary"
                        >
                          {s.title}
                        </Link>
                        {/* Las del curso se clasifican por dificultad y las del
                            docente por quiz o taller; nunca por las dos. */}
                        <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                          {/* Las del temario no llevan numero de actividad: ese
                              contador es de las que publica el docente. */}
                          {s.source === "bank" ? "Del curso" : `#${s.activityNumber}`} ·{" "}
                          {s.source === "bank"
                            ? (s.difficulty ? DIFFICULTY_LABEL[s.difficulty] : "Curso")
                            : s.activityType === "quiz"
                              ? "Quiz"
                              : "Taller"}{" "}
                          · {s.evaluationType === "manual" ? "Revisión docente" : "Auto-evaluada"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-medium",
                            meta.text,
                          )}
                        >
                          <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {s.score !== null ? (
                          <span
                            className={cn(
                              "font-mono text-sm font-medium",
                              s.score >= 80
                                ? "text-success"
                                : s.score >= 60
                                  ? "text-warning"
                                  : "text-danger",
                            )}
                          >
                            {s.score}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
