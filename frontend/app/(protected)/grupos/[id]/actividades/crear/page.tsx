"use client"

import { Suspense, useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, Send } from "lucide-react"
import { notify, notifyPromise } from "@shared/lib/toast"
import { ActionButton } from "@shared/components/action-button"
import { Stepper } from "@shared/components/stepper"
import { Skeleton } from "@shared/components/skeleton"
import { createActivity, updateActivity, getGroupActivity } from "@/lib/features/teacher/data"
import { checkError } from "@/lib/features/teacher/check-validation"
import { ActivityBasicStep } from "@/lib/features/teacher/components/activity-basic-step"
import { ActivityChecksStep } from "@/lib/features/teacher/components/activity-checks-step"
import { ActivitySummaryStep } from "@/lib/features/teacher/components/activity-summary-step"
import type { ActivityCheck } from "@/lib/features/teacher/components/check-builder"
import { queryKeys } from "@/lib/api/queries"
import type { ActivityType, CreateActivityInput, Difficulty, EvaluationType } from "@/lib/features/teacher/types"
import { currentBogotaInputValue, parseBogotaInput, toBogotaInputValue } from "@/lib/utils/dates"
import { RoleGuard } from "@shared/components/role-guard"

/** La escala de calificacion es fija: 0 a 100. */
const MAX_SCORE = 100

const STEPS = [
  { id: "basica", label: "Información básica" },
  { id: "validaciones", label: "Validaciones (checks)" },
  { id: "resumen", label: "Resumen" },
]

function NewActivityPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const groupId = params?.id ?? ""
  const editId = searchParams.get("edit")
  const editing = Boolean(editId)

  const [step, setStep] = useState(0)
  const [activityName, setActivityName] = useState("")
  const [selectedTopic, setSelectedTopic] = useState("")
  const [difficulty, setDifficulty] = useState<Difficulty>("basic")
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

  // Las dos compuertas del asistente: sin un paso publicable no se avanza al
  // siguiente. En validaciones, un reparto que se pasa de los 100 pts tambien
  // lo rechazaria el backend al publicar.
  const step1Error =
    !activityName.trim()
      ? "Falta el título de la actividad."
      : attemptLimitError || (dueDate && parseBogotaInput(dueDate) <= new Date())
        ? "La fecha de cierre debe ser posterior a la fecha actual."
        : ""
  const checkTotal = checks.reduce((sum, c) => sum + (Number(c.points) || 0), 0)
  const firstInvalid = evaluationType === "atomic" ? checks.findIndex((c) => checkError(c) !== null) : -1
  const step2Error =
    evaluationType === "atomic" && checks.length === 0
      ? "Agrega al menos una aserción para poder validar la actividad."
      : firstInvalid !== -1
        ? `La aserción ${firstInvalid + 1} está incompleta: ${checkError(checks[firstInvalid])}.`
        : evaluationType === "atomic" && !distributeEvenly && checkTotal > MAX_SCORE
          ? `El puntaje asignado (${checkTotal}) supera los ${MAX_SCORE} pts.`
          : ""

  // Modo edicion: se carga la actividad publicada y se rellena el asistente.
  useEffect(() => {
    if (!editId) return
    let alive = true
    getGroupActivity(groupId, editId)
      .then((activity) => {
        if (!alive || !activity) return
        setActivityName(activity.title)
        setSelectedTopic(activity.topicNumber ? String(activity.topicNumber) : "")
        setDifficulty(activity.difficulty ?? "basic")
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
    if (!activityName.trim() || step1Error || step2Error) return

    setPublishing(true)
    const input: CreateActivityInput = {
      title: activityName.trim(),
      topicNumber: Number(selectedTopic) || 0,
      source: "teacher",
      difficulty,
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
      // La pestaña de actividades del curso, su conteo y el cuaderno de
      // calificaciones quedan viejos.
      queryClient.invalidateQueries({ queryKey: queryKeys.groupActivities(groupId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.gradebook(groupId) })
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
        router.push(`/grupos/${groupId}/actividades/${editId}`)
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
        router.push(`/grupos/${groupId}`)
      }
    }
  }

  const gateError = step === 0 ? step1Error : step === 1 ? step2Error : ""

  if (loadingDetail) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 px-6 py-10">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-40" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <ActionButton
        tone="neutral"
        href={editing ? `/grupos/${groupId}/actividades/${editId}` : `/grupos/${groupId}?tab=actividades`}
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
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

      <Stepper
        className="mb-8"
        steps={STEPS}
        current={step}
        onSelect={(i) => i < step && setStep(i)}
        orientation="horizontal"
      />

      <div className="rounded-xl border border-table-line bg-card p-6">
        {step === 0 && (
          <ActivityBasicStep
            title={activityName}
            onTitleChange={setActivityName}
            topic={selectedTopic}
            onTopicChange={setSelectedTopic}
            instructions={instructions}
            onInstructionsChange={setInstructions}
            activityType={activityType}
            onActivityTypeChange={setActivityType}
            attemptLimit={attemptLimit}
            onAttemptLimitChange={setAttemptLimit}
            attemptLimitError={attemptLimitError}
            dueDate={dueDate}
            onDueDateChange={setDueDate}
            minDateTime={minDateTime}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
          />
        )}
        {step === 1 && (
          <ActivityChecksStep
            evaluationType={evaluationType}
            onEvaluationTypeChange={setEvaluationType}
            checks={checks}
            onChecksChange={setChecks}
            distributeEvenly={distributeEvenly}
            onDistributeChange={setDistributeEvenly}
          />
        )}
        {step === 2 && (
          <ActivitySummaryStep
            title={activityName.trim()}
            topic={selectedTopic}
            difficulty={difficulty}
            activityType={activityType}
            attemptLimit={attemptLimit}
            dueDate={dueDate}
            instructions={instructions}
            evaluationType={evaluationType}
            checks={checks}
          />
        )}
      </div>

      {/* Navegacion del asistente. El bloqueo es silencioso pero explícito:
          la razon se muestra al lado de los botones. */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {step > 0 && (
          <ActionButton tone="neutral" onClick={() => setStep(step - 1)}>
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </ActionButton>
        )}
        <ActionButton tone="neutral" href={`/grupos/${groupId}`} className="sm:ml-auto">
          Cancelar
        </ActionButton>
        {step < 2 ? (
          <ActionButton
            tone="primary"
            onClick={() => {
              // La validacion del paso se reporta al momento de intentar
              // avanzar, como toast: el formulario no se rompe con texto
              // rojo permanente junto a los botones.
              if (gateError) {
                notify.error(null, gateError)
                return
              }
              setStep(step + 1)
            }}
          >
            Siguiente
            <ArrowRight className="h-4 w-4" />
          </ActionButton>
        ) : (
          <ActionButton tone="primary" onClick={handlePublish} disabled={publishing}>
            <Send className="h-4 w-4" />
            {publishing ? "Guardando…" : editing ? "Guardar cambios" : "Publicar actividad"}
          </ActionButton>
        )}
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
