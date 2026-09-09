"use client"

import { useMemo, useState } from "react"
import { ChevronDown, Circle, CheckCircle2 } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@shared/components/ui/dialog"
import { ProgressBar } from "@shared/components/progress-indicators"
import { Skeleton } from "@shared/components/skeleton"
import { cn } from "@shared/lib/utils"
import { timeAgo } from "@/lib/utils/dates"
import { useStudentPerformance } from "@/lib/api/queries"
import type { ProgressStatus, StudentProgress } from "@/lib/features/teacher/types"
import type { GradebookCellStatus, GradeSeriesPoint, TopicSubtopics } from "@/lib/models/groups"
import type { Topic } from "@/lib/features/student/types"

interface StudentProgressDialogProps {
  groupId: string
  student: StudentProgress | null
  topics: Topic[]
  /** El índice de lecciones del temario, del mismo endpoint que las filas. */
  topicSubtopics: TopicSubtopics[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_META: Record<ProgressStatus, { label: string; color: string; text: string }> = {
  completed: { label: "Completado", color: "var(--success)", text: "text-success" },
  "in-progress": { label: "En progreso", color: "var(--warning)", text: "text-warning" },
  "not-started": { label: "Sin iniciar", color: "var(--muted-foreground)", text: "text-muted-foreground" },
  overdue: { label: "Sin iniciar", color: "var(--muted-foreground)", text: "text-muted-foreground" },
}

function metaFor(status: ProgressStatus) {
  return STATUS_META[status] ?? STATUS_META["not-started"]
}

/** El estado de una actividad, con las mismas palabras que el cuaderno de notas. */
const ESTADO_ACTIVIDAD: Record<GradebookCellStatus, { label: string; text: string; dot: string }> = {
  completed: { label: "Completada", text: "text-success", dot: "bg-success" },
  "under-review": { label: "En revisión", text: "text-warning", dot: "bg-warning" },
  overdue: { label: "Vencida", text: "text-danger", dot: "bg-danger" },
  "not-started": {
    label: "Sin iniciar",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
}

/** Una dona con su cifra en el centro. Las dos de la cabecera son iguales. */
function Dona({
  data,
  valor,
  pie,
}: {
  data: { name: string; value: number; color: string }[]
  valor: string
  pie: string
}) {
  return (
    <div className="relative h-[150px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={46}
            outerRadius={64}
            paddingAngle={2}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-foreground">{valor}</span>
        <span className="text-xs text-muted-foreground">{pie}</span>
      </div>
    </div>
  )
}

/** Las dos cifras que acompañan a una dona. */
function Cifras({
  filas,
}: {
  filas: { label: string; value: string; text: string }[]
}) {
  return (
    <div className="space-y-1.5">
      {filas.map((f) => (
        <div key={f.label} className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-muted-foreground">{f.label}</span>
          <span className={cn("font-medium tabular-nums", f.text)}>{f.value}</span>
        </div>
      ))}
    </div>
  )
}

/** Una actividad dentro del desglose, con su estado y su nota. */
function FilaActividad({ a }: { a: GradeSeriesPoint }) {
  const meta = ESTADO_ACTIVIDAD[a.status] ?? ESTADO_ACTIVIDAD["not-started"]
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="flex min-w-0 items-center gap-2">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)} />
        <span className="truncate text-xs text-foreground">{a.title}</span>
        <span className={cn("shrink-0 text-[10px] uppercase tracking-wide", meta.text)}>
          {meta.label}
        </span>
      </span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {a.score != null ? `${a.score}/100` : "—"}
      </span>
    </div>
  )
}

/**
 * La ficha de progreso de un estudiante.
 *
 * El desglose por tema se despliega: dentro van sus lecciones una por una y las
 * actividades de ese tema, las del temario y las que el docente le asoció. Antes
 * las actividades iban en una lista plana al final, donde no había forma de
 * saber a qué tema pertenecía cada una.
 *
 * Las que el docente creó sin tema no tienen de dónde colgar, así que van
 * aparte al final. En el cuaderno de notas viajan con `topicNumber: 0`.
 */
export function StudentProgressDialog({
  groupId,
  student,
  topics,
  topicSubtopics,
  open,
  onOpenChange,
}: StudentProgressDialogProps) {
  const [abierto, setAbierto] = useState<number | null>(null)

  const topicProgressById = useMemo(
    () => new Map((student?.topicProgress ?? []).map((t) => [t.topicNumber, t])),
    [student],
  )
  const subtopicsById = useMemo(
    () => new Map(topicSubtopics.map((t) => [t.topicNumber, t.subtopics])),
    [topicSubtopics],
  )

  /* Las actividades salen del mismo sitio que el cajón de rendimiento, que ya
     las tenía: la ficha de progreso solo hablaba de lecciones, y la pregunta que
     trae aquí al docente —qué ha resuelto y con qué nota— se contestaba dando un
     rodeo por la pestaña de calificaciones. La consulta se queda quieta mientras
     no haya nadie seleccionado (`enabled` en el hook). */
  const rendimiento = useStudentPerformance(groupId, student?.student.id ?? "")
  const series = useMemo(() => rendimiento.data?.series ?? [], [rendimiento.data])
  const actividadesPorTema = useMemo(() => {
    const mapa = new Map<number, GradeSeriesPoint[]>()
    for (const a of series) {
      if (!mapa.has(a.topicNumber)) mapa.set(a.topicNumber, [])
      mapa.get(a.topicNumber)!.push(a)
    }
    return mapa
  }, [series])

  if (!student) return null

  const { student: person, topicStatus, progress, lastActivity } = student
  const statuses = topics.map((t) => topicStatus[t.number] ?? "not-started")
  const completados = statuses.filter((s) => s === "completed").length
  const enProgreso = statuses.filter((s) => s === "in-progress").length
  const sinIniciar = statuses.filter((s) => s === "not-started").length

  const donutTemas = [
    { name: "Completado", value: completados, color: "var(--success)" },
    { name: "En progreso", value: enProgreso, color: "var(--warning)" },
    { name: "Sin iniciar", value: sinIniciar, color: "var(--muted-foreground)" },
  ].filter((d) => d.value > 0)

  const resumen = rendimiento.data?.summary
  const actTotal = resumen?.total ?? 0
  const actHechas = resumen?.completed ?? 0
  const actPct = actTotal > 0 ? Math.round((actHechas / actTotal) * 100) : 0
  const donutActividades = [
    { name: "Completadas", value: actHechas, color: "var(--success)" },
    { name: "Pendientes", value: Math.max(0, actTotal - actHechas), color: "var(--muted-foreground)" },
  ].filter((d) => d.value > 0)

  /* Cada dona con sus dos cifras al lado. Juntas y con las cuatro líneas
     amontonadas a la derecha no se veía qué número pertenecía a qué círculo. */
  const cifrasTemas = [
    { label: "Temas completados", value: `${completados}/${topics.length}`, text: "text-success" },
    { label: "Temas en progreso", value: String(enProgreso), text: "text-warning" },
  ]
  const cifrasActividades = [
    { label: "Actividades", value: `${actHechas}/${actTotal}`, text: "text-foreground" },
    {
      label: "Promedio",
      value: resumen?.average != null ? String(resumen.average) : "—",
      text: "text-foreground",
    },
  ]

  const sueltas = actividadesPorTema.get(0) ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{person.name}</DialogTitle>
          <DialogDescription>
            Última actividad: {lastActivity ? timeAgo(lastActivity) : "Sin actividad"}
          </DialogDescription>
        </DialogHeader>

        {/* Dos donas, cada una con sus cifras al lado y a la misma altura.
            Antes solo estaba la de temas, y las actividades no se contaban en
            ninguna parte. */}
        <div className="grid grid-cols-1 items-center gap-x-4 gap-y-2 sm:grid-cols-[auto_1fr_auto_1fr]">
          <Dona data={donutTemas} valor={`${progress}%`} pie="del curso" />
          <Cifras filas={cifrasTemas} />
          <Dona data={donutActividades} valor={`${actPct}%`} pie="actividades" />
          <Cifras filas={cifrasActividades} />
        </div>

        {/* Desglose por tema, desplegable */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Desglose por tema
          </h4>
          <div className="space-y-2">
            {topics.map((topic) => {
              const status = topicStatus[topic.number] ?? "not-started"
              const meta = metaFor(status)
              const detail = topicProgressById.get(topic.number)
              const done = detail?.completed ?? 0
              const total = detail?.total ?? 0
              const percent = total > 0 ? Math.round((done / total) * 100) : 0
              const hechos = new Set(detail?.doneSubtopics ?? [])
              const lecciones = subtopicsById.get(topic.number) ?? []
              const actividades = actividadesPorTema.get(topic.number) ?? []
              const desplegado = abierto === topic.number

              return (
                <div
                  key={topic.number}
                  className="rounded-md border border-border bg-secondary/30"
                >
                  <button
                    type="button"
                    onClick={() => setAbierto(desplegado ? null : topic.number)}
                    className="w-full px-3 py-2.5 text-left transition-colors hover:bg-foreground/[0.03]"
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <span className="truncate text-sm text-foreground">
                        {topic.number}. {topic.title}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-medium",
                            meta.text,
                          )}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: meta.color }}
                          />
                          {meta.label}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            desplegado && "rotate-180",
                          )}
                        />
                      </span>
                    </div>
                    <ProgressBar value={percent} />
                    <div className="mt-1 text-[10px] tabular-nums text-muted-foreground">
                      {done}/{total} lecciones
                      {actividades.length > 0 && ` · ${actividades.length} actividades`}
                    </div>
                  </button>

                  {/* `grid-rows-[0fr] → [1fr]`, el mismo plegado que la barra de
                      contenidos en móvil. */}
                  <div
                    className={cn(
                      "grid transition-all duration-200 ease-out",
                      desplegado ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-0.5 border-t border-border px-3 py-2">
                        {lecciones.length === 0 ? (
                          <p className="py-1 text-xs text-muted-foreground">
                            Este tema todavía no tiene lecciones publicadas.
                          </p>
                        ) : (
                          lecciones.map((sub) => {
                            const leida = hechos.has(sub.id)
                            return (
                              <div key={sub.id} className="flex items-center gap-2 py-1">
                                {leida ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                )}
                                <span
                                  className={cn(
                                    "min-w-0 truncate text-xs",
                                    leida ? "text-muted-foreground" : "text-foreground",
                                  )}
                                >
                                  {sub.title}
                                </span>
                              </div>
                            )
                          })
                        )}

                        {actividades.length > 0 && (
                          <div className="mt-1.5 border-t border-border/60 pt-1.5">
                            {actividades.map((a) => (
                              <FilaActividad key={a.activityId} a={a} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Las que el docente creó sin tema: no hay desglose del que colgarlas. */}
        {sueltas.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sin tema asociado
            </h4>
            <div className="rounded-md border border-border bg-secondary/30 px-3 py-2">
              {sueltas.map((a) => (
                <FilaActividad key={a.activityId} a={a} />
              ))}
            </div>
          </div>
        )}

        {rendimiento.isLoading && (
          <div className="space-y-1.5">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-8" />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
