"use client"

import { cn } from "@shared/lib/utils"
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
import { DIFFICULTY_LABEL, DIFFICULTY_TONE } from "@shared/lib/content/activities"
import { syllabus } from "@shared/lib/content/temario"
import type { ActivityType, Difficulty } from "@/lib/features/teacher/types"

const DIFFICULTY_DOT: Record<string, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
}

/**
 * Paso 1 del asistente: los datos que describen la actividad. Los archivos
 * iniciales y el tiempo estimado de la referencia de diseno no aplican aqui:
 * el estudiante trabaja sobre el entorno del laboratorio, no sobre archivos
 * que se le precarguen.
 */
export function ActivityBasicStep({
  title,
  onTitleChange,
  topic,
  onTopicChange,
  instructions,
  onInstructionsChange,
  activityType,
  onActivityTypeChange,
  attemptLimit,
  onAttemptLimitChange,
  attemptLimitError,
  dueDate,
  onDueDateChange,
  minDateTime,
  difficulty,
  onDifficultyChange,
}: {
  title: string
  onTitleChange: (v: string) => void
  topic: string
  onTopicChange: (v: string) => void
  instructions: string
  onInstructionsChange: (v: string) => void
  activityType: ActivityType
  onActivityTypeChange: (v: ActivityType) => void
  attemptLimit: string
  onAttemptLimitChange: (v: string) => void
  attemptLimitError: string
  dueDate: string
  onDueDateChange: (v: string) => void
  minDateTime: string
  difficulty: Difficulty
  onDifficultyChange: (v: Difficulty) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Información básica</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Define los datos principales de la actividad.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="activityName" className="text-muted-foreground">
            Título de la actividad <span className="text-danger">*</span>
          </Label>
          <span className="font-mono text-xs text-muted-foreground">{title.length} / 255</span>
        </div>
        <Input
          id="activityName"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Ej: Script de respaldo"
          maxLength={255}
          className="border-table-line"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="instructions" className="text-muted-foreground">
            Enunciado <span className="text-danger">*</span>
          </Label>
          <span className="font-mono text-xs text-muted-foreground">
            {instructions.length} / 2000
          </span>
        </div>
        <Textarea
          id="instructions"
          value={instructions}
          onChange={(e) => onInstructionsChange(e.target.value)}
          placeholder="Escribe las instrucciones de la actividad…"
          maxLength={2000}
          className="min-h-28 resize-none overflow-y-auto border-table-line text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Aquí le cuentas al estudiante qué debe lograr y cómo; los comandos los
          ejecuta él en la terminal.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-muted-foreground">Tema asociado</Label>
          <Select value={topic} onValueChange={onTopicChange}>
            <SelectTrigger className="w-full border-table-line">
              <SelectValue placeholder="Seleccionar tema" />
            </SelectTrigger>
            <SelectContent>
              {syllabus.map((t) => (
                <SelectItem key={t.number} value={String(t.number)}>
                  {t.number}. {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">Dificultad</Label>
          <Select value={difficulty} onValueChange={(v) => onDifficultyChange(v as Difficulty)}>
            <SelectTrigger className="w-full border-table-line">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => (
                <SelectItem key={d} value={d}>
                  <span className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", DIFFICULTY_DOT[DIFFICULTY_TONE[d]])} />
                    {DIFFICULTY_LABEL[d]}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">Tipo de actividad</Label>
          <Select
            value={activityType}
            onValueChange={(v) => {
              onActivityTypeChange(v as ActivityType)
              if (v === "workshop") onAttemptLimitChange("")
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
              onChange={(e) => onAttemptLimitChange(e.target.value)}
              placeholder="Ej. 3"
              aria-invalid={Boolean(attemptLimitError)}
              className={cn("border-table-line", attemptLimitError && "border-danger")}
            />
            {attemptLimitError && <p className="text-xs text-danger">{attemptLimitError}</p>}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="dueDate" className="text-muted-foreground">
            Fecha y hora de cierre
          </Label>
          <Input
            id="dueDate"
            type="datetime-local"
            value={dueDate}
            min={minDateTime}
            onChange={(e) => onDueDateChange(e.target.value)}
            className="border-table-line [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      </div>
    </div>
  )
}
