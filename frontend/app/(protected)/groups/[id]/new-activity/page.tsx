"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ChevronRight, Calendar, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RichTextEditor } from "@/components/teacher/rich-text-editor"
import { CheckBuilder, type ActivityCheck } from "@/components/teacher/check-builder"
import { cn } from "@/lib/utils"
import { syllabus } from "@/lib/features/shared/temario"
import { createActivity } from "@/lib/features/teacher/data"
import type { EvaluationType } from "@/lib/features/teacher/types"
import { RoleGuard } from "@/components/shared/role-guard"

function NewActivityPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const groupId = params?.id ?? ""

  const [activityName, setActivityName] = useState("")
  const [selectedTopic, setSelectedTopic] = useState("")
  const [maxScore, setMaxScore] = useState("100")
  const [dueDate, setDueDate] = useState("")
  const [isRequired, setIsRequired] = useState(true)
  const [gradingPolicy, setGradingPolicy] = useState<"best_score" | "latest_score">("best_score")
  const [instructions, setInstructions] = useState("")
  const [evaluationType, setEvaluationType] = useState<EvaluationType>("atomic")
  const [checks, setChecks] = useState<ActivityCheck[]>([])
  const [distributeEvenly, setDistributeEvenly] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)

  const handlePublish = async () => {
    setError(null)
    setPublishing(true)
    try {
      await createActivity(groupId, {
        title: activityName,
        topicNumber: Number(selectedTopic) || 0,
        source: "teacher",
        instructions,
        maxScore: Number(maxScore) || 0,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        required: isRequired,
        evaluationType,
        gradingPolicy,
        checks,
      })
      toast.success("Actividad publicada")
      router.push(`/groups/${groupId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo publicar la actividad.")
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-6 py-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/home" className="hover:text-foreground transition-colors">
              Mis Grupos
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href={`/groups/${groupId}`} className="hover:text-foreground transition-colors">
              Grupo
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">Nueva Actividad</span>
          </nav>

          {/* Title and actions */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">Crear nueva actividad</h1>
            <div className="flex items-center gap-3">
              <Link href={`/groups/${groupId}`}>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Cancelar
                </Button>
              </Link>
              <Button
                onClick={handlePublish}
                disabled={publishing}
                className="border border-primary/40 bg-primary/15 text-primary shadow-none hover:bg-primary/25"
              >
                <Send className="w-4 h-4 mr-2" />
                {publishing ? "Publicando…" : "Publicar actividad"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Formulario centrado */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-6 py-8 space-y-8">
          {error && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            {/* Section 1: General Information */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <div className="w-6 h-6 bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-medium text-primary">
                  1
                </div>
                <h2 className="text-lg font-medium text-foreground">Información general</h2>
              </div>

              <div className="grid gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Nombre de la actividad
                  </label>
                  <Input
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    placeholder="Ej: Tarea: Script de backup"
                    className="bg-secondary/30 border-border focus:border-primary/50 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Tema asociado</label>
                    <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                      <SelectTrigger className="bg-secondary/30 border-border focus:border-primary/50 focus:ring-primary/20">
                        <SelectValue placeholder="Seleccionar tema" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {syllabus.map((topic) => (
                          <SelectItem
                            key={topic.number}
                            value={String(topic.number)}
                            className="focus:bg-primary/10 focus:text-foreground"
                          >
                            {topic.number}. {topic.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Puntuación máxima</label>
                    <Input
                      type="number"
                      value={maxScore}
                      onChange={(e) => setMaxScore(e.target.value)}
                      placeholder="100"
                      min="0"
                      className="bg-secondary/30 border-border focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Fecha y hora de cierre
                    </label>
                    <div className="relative">
                      <Input
                        type="datetime-local"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="bg-secondary/30 border-border focus:border-primary/50 focus:ring-primary/20 [color-scheme:dark]"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Política de calificación
                    </label>
                    <Select
                      value={gradingPolicy}
                      onValueChange={(v) =>
                        setGradingPolicy(v as "best_score" | "latest_score")
                      }
                    >
                      <SelectTrigger className="bg-secondary/30 border-border focus:border-primary/50 focus:ring-primary/20">
                        <SelectValue placeholder="Política de calificación" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem
                          value="best_score"
                          className="focus:bg-primary/10 focus:text-foreground"
                        >
                          Mejor intento
                        </SelectItem>
                        <SelectItem
                          value="latest_score"
                          className="focus:bg-primary/10 focus:text-foreground"
                        >
                          Último intento
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Obligatoriedad</label>
                  <div className="flex items-center gap-3 h-9">
                    <Switch
                      checked={isRequired}
                      onCheckedChange={setIsRequired}
                      className="data-[state=checked]:bg-primary"
                    />
                    <span className="text-sm text-muted-foreground">
                      {isRequired ? (
                        <span className="text-foreground font-medium">Obligatoria</span>
                      ) : (
                        "Complementaria"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Instructions */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <div className="w-6 h-6 bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-medium text-primary">
                  2
                </div>
                <h2 className="text-lg font-medium text-foreground">Instrucciones</h2>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Describe la actividad para los estudiantes
                </label>
                <RichTextEditor
                  value={instructions}
                  onChange={setInstructions}
                  placeholder="Escribe las instrucciones de la actividad..."
                />
                <p className="text-xs text-muted-foreground">
                  Puedes usar formato Markdown para organizar las instrucciones.
                </p>
              </div>
            </section>

            {/* Section 3: Evaluation */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <div className="w-6 h-6 bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-medium text-primary">
                  3
                </div>
                <h2 className="text-lg font-medium text-foreground">Validación</h2>
              </div>

              <div className="flex items-center gap-2 p-1 bg-secondary/40 border border-border rounded-md w-fit">
                <button
                  onClick={() => setEvaluationType("atomic")}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded transition-all",
                    evaluationType === "atomic"
                      ? "bg-card border border-border shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Aserciones atómicas
                </button>
                <button
                  onClick={() => setEvaluationType("manual")}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded transition-all",
                    evaluationType === "manual"
                      ? "bg-card border border-border shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Revisión manual
                </button>
              </div>

              {evaluationType === "atomic" ? (
                <>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Define cómo se valida la actividad agregando aserciones del catálogo.
                    El sistema las ejecuta sobre el entorno del estudiante cuando este
                    solicita la validación, sin necesidad de escribir scripts. El valor
                    de la actividad ({maxScore || 0} pts) se reparte entre las aserciones.
                  </p>
                  <CheckBuilder
                    checks={checks}
                    onChange={setChecks}
                    activityValue={Number(maxScore) || 0}
                    distributeEvenly={distributeEvenly}
                    onDistributeChange={setDistributeEvenly}
                  />
                </>
              ) : (
                <div className="bg-secondary/20 border border-border rounded-md p-4 space-y-2">
                  <p className="text-sm text-foreground font-medium">
                    El docente revisa y califica manualmente
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    El estudiante podrá enviar su trabajo desde la vista de la actividad.
                    Recibirás el aviso en el{" "}
                    <Link
                      href={`/groups/${groupId}/tracking`}
                      className="text-primary hover:underline"
                    >
                      panel de seguimiento
                    </Link>{" "}
                    y podrás revisarlo, asignar la calificación y dar retroalimentación
                    de forma manual.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    La actividad tendrá un valor de{" "}
                    <span className="font-medium text-foreground">{maxScore || 0} pts</span>{" "}
                    asignados directamente por ti.
                  </p>
                </div>
              )}
            </section>
          </div>
      </div>
    </div>
  )
}

export default function NewActivityPageWrapper() {
  return (
    <RoleGuard roles={["teacher", "admin"]}>
      <NewActivityPage />
    </RoleGuard>
  )
}
