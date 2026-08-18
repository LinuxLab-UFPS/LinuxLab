"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download, FileText, Folder, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { ActionButton } from "@shared/components/action-button"
import { Input } from "@shared/components/ui/input"
import { Textarea } from "@shared/components/ui/textarea"
import { Label } from "@shared/components/ui/label"
import { Tag } from "@shared/components/tag"
import { notify } from "@shared/lib/toast"
import { formatBogotaDateTime } from "@/lib/utils/dates"
import { teacherApi } from "@/lib/features/teacher/api"
import type { StudentActivityDetail as StudentActivityDetailType } from "@/lib/features/teacher/types"

interface Props {
  detail: StudentActivityDetailType
  groupId: string
  activityId: string
  isTeacher: boolean
}

export function StudentActivityDetail({ detail, groupId, activityId, isTeacher }: Props) {
  const { student, activity } = detail

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <Link
          href={`/groups/${groupId}/activities/${activityId}`}
          className="mb-4 inline-flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a la actividad
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            {student.name}
            {student.code && (
              <span className="ml-2 font-mono text-muted-foreground">({student.code})</span>
            )}
          </h1>
          <Tag tone="neutral">{activity.activityType === "quiz" ? "Quiz" : "Taller"}</Tag>
          <Tag tone="neutral">
            {activity.evaluationType === "manual" ? "Revisión manual" : "Autoevaluación"}
          </Tag>
        </div>
      </div>

      {detail.type === "manual" ? (
        <ManualDetail detail={detail} isTeacher={isTeacher} />
      ) : (
        <AutomaticDetail detail={detail} maxScore={activity.maxScore} />
      )}
    </div>
  )
}

function ManualDetail({
  detail,
  isTeacher,
}: {
  detail: Extract<StudentActivityDetailType, { type: "manual" }>
  isTeacher: boolean
}) {
  const { activity, submission } = detail
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState("")
  const [loadingFile, setLoadingFile] = useState(false)
  const [score, setScore] = useState(submission?.score != null ? String(submission.score) : "")
  const [feedback, setFeedback] = useState(submission?.feedback ?? "")
  const [grading, setGrading] = useState(false)

  const loadFile = async (path: string) => {
    setSelectedFile(path)
    setLoadingFile(true)
    try {
      const data = await teacherApi.getSubmissionFile(submission!.id, path)
      setFileContent(data.content)
    } catch {
      notify.error(null, "No se pudo cargar el archivo")
      setFileContent("")
    } finally {
      setLoadingFile(false)
    }
  }

  const handleGrade = async () => {
    const parsed = Number(score)
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > activity.maxScore) {
      notify.error(null, `La calificación debe ser un entero entre 0 y ${activity.maxScore}`)
      return
    }
    setGrading(true)
    try {
      await teacherApi.gradeSubmission(submission!.id, parsed, feedback || undefined)
      notify.success("Calificación guardada")
    } catch (e) {
      notify.error(e, "No se pudo guardar la calificación")
    } finally {
      setGrading(false)
    }
  }

  if (!submission) {
    return (
      <div className="rounded-xl border border-border bg-background p-8 text-center">
        <p className="text-sm text-muted-foreground">Este estudiante aún no ha entregado la actividad.</p>
      </div>
    )
  }

  const tree = submission.evidence.tree ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Tag tone={submission.status === "graded" ? "emerald" : "amber"}>
          {submission.status === "graded" ? "Calificada" : "Pendiente"}
        </Tag>
        <span className="text-xs text-muted-foreground">
          Entregado: {formatBogotaDateTime(submission.submittedAt)}
        </span>
        {submission.score != null && (
          <span className="text-xs font-medium text-foreground">
            Calificación: {submission.score}/{activity.maxScore}
          </span>
        )}
        <a
          href={`/api/submissions/${submission.id}/download`}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Download className="h-3.5 w-3.5" />
          Descargar .zip
        </a>
      </div>

      <div className="flex min-h-[400px] overflow-hidden rounded-xl border border-border">
        <div className="w-60 shrink-0 overflow-y-auto border-r border-border bg-background p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
            Archivos ({tree.length})
          </p>
          <div className="space-y-0.5">
            {tree.map((path) => {
              const isDir = path.endsWith("/")
              const name = path.split("/").filter(Boolean).pop() ?? path
              return (
                <div key={path} className="group flex items-center">
                  <button
                    type="button"
                    onClick={() => !isDir && loadFile(path)}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors",
                      selectedFile === path
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                    )}
                  >
                    {isDir ? (
                      <Folder className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate font-mono text-xs">{name}</span>
                  </button>
                  {!isDir && (
                    <a
                      href={`/api/submissions/${submission.id}/files/download/${encodeURIComponent(path)}`}
                      className="ml-1 shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                      title="Descargar archivo"
                    >
                      <Download className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="font-mono text-xs text-muted-foreground">
              {selectedFile ?? "Selecciona un archivo"}
            </span>
            {selectedFile && (
              <a
                href={`/api/submissions/${submission.id}/files/download/${encodeURIComponent(selectedFile)}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Download className="h-3 w-3" />
                Descargar
              </a>
            )}
          </div>
          <div className="flex-1 overflow-auto bg-background p-4">
            {loadingFile ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando...
              </div>
            ) : selectedFile ? (
              <pre className="whitespace-pre-wrap font-mono text-sm text-foreground">
                {fileContent}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                Selecciona un archivo del árbol para ver su contenido.
              </p>
            )}
          </div>
        </div>
      </div>

      {isTeacher && submission.status !== "graded" && (
        <div className="rounded-xl border border-border bg-background p-4">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase">Calificación</h3>
          <div className="flex gap-4">
            <div className="w-32 space-y-1">
              <Label className="text-xs text-muted-foreground">
                Calificación (/{activity.maxScore})
              </Label>
              <Input
                type="number"
                min={0}
                max={activity.maxScore}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="border-table-line font-mono"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Retroalimentación</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={2}
                placeholder="Comentarios para el estudiante..."
                className="border-table-line text-sm"
              />
            </div>
            <div className="flex items-end">
              <ActionButton tone="amber" onClick={handleGrade} disabled={grading}>
                {grading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Calificar
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {submission.status === "graded" && submission.feedback && (
        <div className="rounded-xl border border-border bg-secondary/20 p-4">
          <p className="mb-1 text-xs font-medium text-muted-foreground uppercase">Retroalimentación</p>
          <p className="whitespace-pre-wrap text-sm text-foreground">{submission.feedback}</p>
        </div>
      )}
    </div>
  )
}

function AutomaticDetail({
  detail,
  maxScore,
}: {
  detail: Extract<StudentActivityDetailType, { type: "automatic" }>
  maxScore: number
}) {
  const [selectedAttempt, setSelectedAttempt] = useState<number | null>(
    detail.attempts.length > 0 ? detail.attempts[detail.attempts.length - 1].attemptNumber : null,
  )

  const attempt = detail.attempts.find((a) => a.attemptNumber === selectedAttempt)

  if (detail.attempts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-background p-8 text-center">
        <p className="text-sm text-muted-foreground">Este estudiante aún no ha intentado la actividad.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Tag tone={detail.finalScore > 0 ? "sky" : "neutral"}>
          Calificación final: {detail.finalScore}/{maxScore}
        </Tag>
        <span className="text-xs text-muted-foreground">
          {detail.attempts.length} {detail.attempts.length === 1 ? "intento" : "intentos"}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-card border-b border-border">
                <th className="w-16 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">
                  N.°
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">
                  Fecha
                </th>
                <th className="w-24 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">
                  Estado
                </th>
                <th className="w-32 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase">
                  Calificación
                </th>
              </tr>
            </thead>
            <tbody>
              {detail.attempts.map((a) => (
                <tr
                  key={a.attemptNumber}
                  onClick={() => setSelectedAttempt(a.attemptNumber)}
                  className={cn(
                    "cursor-pointer border-b border-border/50 transition-colors last:border-0",
                    selectedAttempt === a.attemptNumber
                      ? "bg-secondary text-foreground"
                      : "bg-background hover:bg-secondary/30",
                  )}
                >
                  <td className="px-4 py-2.5 text-center font-mono text-sm">{a.attemptNumber}</td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">
                    {formatBogotaDateTime(a.createdAt)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {a.passed ? (
                      <CheckCircle2 className="inline h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="inline h-4 w-4 text-destructive" />
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center font-mono text-sm">{a.score}/{maxScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {attempt && (
        <div className="rounded-xl border border-border bg-background p-4">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase">
            Resultados del intento {attempt.attemptNumber}
          </h3>
          <div className="space-y-2">
            {attempt.results.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                  r.passed
                    ? "border-success/30 bg-success/5"
                    : "border-destructive/30 bg-destructive/5",
                )}
              >
                {r.passed ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-foreground">{r.type}</span>
                  {r.detail && (
                    <span className="ml-2 text-muted-foreground">— {r.detail}</span>
                  )}
                </div>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {r.passed ? r.points : 0}/{r.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
