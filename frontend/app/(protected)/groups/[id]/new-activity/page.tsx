"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Loader2, Send } from "lucide-react"
import { notify, notifyPromise } from "@shared/lib/toast"
import { ActionButton } from "@shared/components/action-button"
import { Input } from "@shared/components/ui/input"
import { Label } from "@shared/components/ui/label"
import { Textarea } from "@shared/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import { CheckBuilder, type ActivityCheck } from "@/lib/features/teacher/components/check-builder"
import { cn } from "@shared/lib/utils"
import { syllabus } from "@shared/lib/content/temario"
import { createActivity, updateActivity, getGroupActivity } from "@/lib/features/teacher/data"
import { queryKeys } from "@/lib/api/queries"
import type { ActivityType, CreateActivityInput, EvaluationType } from "@/lib/features/teacher/types"
import { currentBogotaInputValue, parseBogotaInput, toBogotaInputValue } from "@/lib/utils/dates"
import { RoleGuard } from "@shared/components/role-guard"

/** La escala de calificacion es fija: 0 a 100. */
const MAX_SCORE = 100

/** Bloque del formulario: cabecera con su título y el cuerpo debajo. */
function Seccion({
  title,
  description,
  children,
}: {
  title: string
  description?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-table-line bg-card">
      <div className="border-b border-table-line px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  )
}

function NewActivityPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const groupId = params?.id ?? ""
  const editId = searchParams.get("edit")
  const editing = Boolean(editId)

  const [activityName, setActivityName] = useState("")
  const [selectedTopic, setSelectedTopic] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [activityType, setActivityType] = useState<ActivityType>("workshop")
  const [attemptLimit, setAttemptLimit] = useState("")
  const [instructions, setInstructions] = useState("")
  const [evaluationType, setEvaluationType] = useState<EvaluationType>("atomic")
  const [checks, setChecks] = useState<ActivityCheck[]>([])
  const [distributeEvenly, setDistributeEvenly] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(Boolean(editId))
  const [publishing, setPublishing] = useState(false)
  const attemptLimitError =
    activityType === "quiz" &&
    attemptLimit.trim() !== "" &&
    (!Number.isInteger(Number(attemptLimit)) || Number(attemptLimit) < 1)
      ? "El límite debe ser un entero positivo."
      : ""

  // Modo edicion: se carga la actividad publicada y se rellena el formulario.
  useEffect(() => {
    if (!editId) return
    let alive = true
    getGroupActivity(groupId, editId)
      .then((activity) => {
        if (!alive || !activity) return
        setActivityName(activity.title)
        setSelectedTopic(activity.topicNumber ? String(activity.topicNumber) : "")
        setDueDate(activity.dueDate ? toBogotaInputValue(activity.dueDate) : "")
        setActivityType(activity.activityType ?? "workshop")
        setAttemptLimit(activity.attemptLimit ? String(activity.attemptLimit) : "")
        setInstructions(activity.instructions ?? "")
        setEvaluationType(activity.evaluationType)
        setChecks(activity.checks.map((c) => ({ id: c.id, type: c.type, params: c.params, points: c.points })))
        setDistributeEvenly(false)
      })
      .catch((e) => {
        if (alive) notify.error(e, "No se pudo cargar la actividad para editar")
      })
      .finally(() => {
        if (alive) setLoadingDetail(false)
      })
    return () => {
      alive = false
    }
  }, [groupId, editId])

  // El minimo del datetime-local se arma en hora local para que el selector
  // no ofrezca momentos ya pasados (la validacion real ocurre al publicar).
  const minDateTime = currentBogotaInputValue()

  const handlePublish = async () => {
    let hasError = false
    const title = activityName.trim()
    if (!title) {
      notify.error(null, "El nombre de la actividad es requerido")
      hasError = true
    } else if (title.length > 255) {
      notify.error(null, "El nombre no puede superar los 255 caracteres")
      hasError = true
    }
    if (instructions.length > 2000) {
      notify.error(null, "La descripción no puede superar los 2000 caracteres")
      hasError = true
    }
    if (dueDate && parseBogotaInput(dueDate) <= new Date()) {
      notify.error(null, "La fecha de cierre debe ser posterior a la fecha actual")
      hasError = true
    }
    if (attemptLimitError) {
      notify.error(null, attemptLimitError)
      hasError = true
    }
    if (hasError) return

    setPublishing(true)
    const input: CreateActivityInput = {
      title,
      topicNumber: Number(selectedTopic) || 0,
      source: "teacher",
      instructions,
      maxScore: MAX_SCORE,
      dueDate: dueDate ? parseBogotaInput(dueDate).toISOString() : undefined,
      required: true,
      evaluationType,
      activityType,
      attemptLimit: activityType === "quiz" && attemptLimit.trim() ? Number(attemptLimit) : null,
      checks,
    }
    const refreshed = () => {
      // La pestaña de actividades del curso y su conteo quedan viejos.
      queryClient.invalidateQueries({ queryKey: queryKeys.groupActivities(groupId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) })
    }
    if (editId) {
      const updated = await notifyPromise(updateActivity(groupId, editId, input), {
        loading: "Guardando cambios…",
        success: "Actividad actualizada",
        error: "No se pudo guardar la actividad.",
      })
      setPublishing(false)
      if (updated.ok) {
        refreshed()
        router.push(`/groups/${groupId}/activities/${editId}`)
      }
    } else {
      const created = await notifyPromise(createActivity(groupId, input), {
        loading: "Publicando actividad…",
        success: "Actividad publicada",
        error: "No se pudo guardar la actividad.",
      })
      setPublishing(false)
      if (created.ok) {
        refreshed()
        router.push(`/groups/${groupId}`)
      }
    }
  }

  if (loadingDetail) {
    return (
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-20 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando la actividad…
      </div>
    )
  }

  return (
    <div data-section="actividades" className="mx-auto max-w-3xl px-6 py-8">
      <ActionButton tone="neutral" href={`/groups/${groupId}`}>
        <ArrowLeft className="h-4 w-4" />
        Volver al curso
      </ActionButton>

      <div className="mb-8 mt-9">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {editing ? "Editar actividad" : "Nueva actividad"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Describe el trabajo y define cómo se valida. Al guardar queda disponible para
          todos los estudiantes del curso.
        </p>
      </div>

      <div className="space-y-6">
        <Seccion title="Información general">
          <div className="space-y-2">
            <Label htmlFor="activityName" className="text-muted-foreground">
              Nombre de la actividad
            </Label>
            <Input
              id="activityName"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="Ej: Script de respaldo"
              maxLength={255}
              className="border-table-line"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Tema asociado</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger className="w-full border-table-line">
                  <SelectValue placeholder="Seleccionar tema" />
                </SelectTrigger>
                <SelectContent>
                  {syllabus.map((topic) => (
                    <SelectItem key={topic.number} value={String(topic.number)}>
                      {topic.number}. {topic.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Puntuación</Label>
              {/* La escala es fija, así que se muestra en vez de pedirse. */}
              <div className="flex h-9 items-center rounded-md border border-table-line bg-secondary/40 px-3 font-mono text-sm text-muted-foreground">
                {MAX_SCORE} pts
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-muted-foreground">
                Fecha y hora de cierre
              </Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                min={minDateTime}
                onChange={(e) => setDueDate(e.target.value)}
                className="border-table-line [color-scheme:dark]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Tipo de actividad</Label>
              <Select
                value={activityType}
                onValueChange={(v) => {
                  setActivityType(v as ActivityType)
                  if (v === "workshop") setAttemptLimit("")
                }}
              >
                <SelectTrigger className="w-full border-table-line">
                  <SelectValue placeholder="Tipo de actividad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workshop">Taller (intentos ilimitados)</SelectItem>
                  <SelectItem value="quiz">Quiz (límite de intentos)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activityType === "quiz" && (
              <div className="space-y-2">
                <Label htmlFor="attemptLimit" className="text-muted-foreground">
                  Límite de intentos
                </Label>
                <Input
                  id="attemptLimit"
                  type="number"
                  min={1}
                  value={attemptLimit}
                  onChange={(e) => setAttemptLimit(e.target.value)}
                  placeholder="Ej. 3"
                  aria-invalid={Boolean(attemptLimitError)}
                  className={cn("border-table-line", attemptLimitError && "border-danger")}
                />
                {attemptLimitError && <p className="text-xs text-danger">{attemptLimitError}</p>}
              </div>
            )}
          </div>
        </Seccion>

        <Seccion
          title="Enunciado"
          description="Lo que el estudiante lee junto a la terminal cuando abre la actividad."
        >
          <div className="space-y-2">
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={7}
              placeholder="Escribe las instrucciones de la actividad…"
              maxLength={2000}
              className="resize-y border-table-line"
            />
          </div>
        </Seccion>

        <Seccion
          title="Validación"
          description={
            evaluationType === "atomic"
              ? `El laboratorio ejecuta las aserciones sobre el entorno del estudiante cuando este pide validar, sin escribir ningún script. Los ${MAX_SCORE} pts se reparten entre ellas.`
              : "Tú revisas y calificas cada entrega."
          }
        >
          {/* Un riel con las dos modalidades: la elegida se levanta sobre el fondo. */}
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-foreground/[0.08] p-1.5">
            {(
              [
                ["atomic", "Aserciones atómicas"],
                ["manual", "Revisión manual"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setEvaluationType(value)}
                className={cn(
                  "h-9 rounded-lg px-3.5 text-sm font-medium transition-colors",
                  evaluationType === value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {evaluationType === "atomic" ? (
            <>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Las rutas son relativas a la carpeta de trabajo de la actividad: escribe
                solo el archivo o directorio que se va a verificar (ej:{" "}
                <code className="font-mono text-foreground">informe.txt</code>).
              </p>
              <CheckBuilder
                checks={checks}
                onChange={setChecks}
                activityValue={MAX_SCORE}
                distributeEvenly={distributeEvenly}
                onDistributeChange={setDistributeEvenly}
              />
            </>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              El estudiante envía su trabajo desde la vista de la actividad y el aviso te
              llega al{" "}
              <Link
                href={`/groups/${groupId}/tracking`}
                className="text-primary hover:underline"
              >
                panel de seguimiento
              </Link>
              , donde asignas los {MAX_SCORE} pts y la retroalimentación.
            </p>
          )}
        </Seccion>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <ActionButton tone="amber" onClick={handlePublish} disabled={publishing || Boolean(attemptLimitError)}>
          <Send className="h-4 w-4" />
          {publishing ? "Guardando…" : editing ? "Guardar cambios" : "Publicar actividad"}
        </ActionButton>
        <ActionButton tone="neutral" href={`/groups/${groupId}`}>
          Cancelar
        </ActionButton>
      </div>
    </div>
  )
}

export default function NewActivityPageWrapper() {
  return (
    <RoleGuard roles={["teacher", "admin"]}>
      <Suspense fallback={null}>
        <NewActivityPage />
      </Suspense>
    </RoleGuard>
  )
}
