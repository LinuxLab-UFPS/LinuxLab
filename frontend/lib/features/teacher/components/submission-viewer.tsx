"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Download, FileText, Folder, Loader2 } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { ActionButton } from "@shared/components/action-button"
import { Input } from "@shared/components/ui/input"
import { Textarea } from "@shared/components/ui/textarea"
import { Label } from "@shared/components/ui/label"
import { Tag } from "@shared/components/tag"
import { notify } from "@shared/lib/toast"
import { formatBogotaDateTime } from "@/lib/utils/dates"
import { teacherApi } from "@/lib/features/teacher/api"
import type { SubmissionDetail } from "@/lib/features/teacher/types"

interface SubmissionViewerProps {
  submissionId: string
  onClose: () => void
  onGraded?: () => void
}

export function SubmissionViewer({ submissionId, onClose, onGraded }: SubmissionViewerProps) {
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [loadingFile, setLoadingFile] = useState(false)
  const [score, setScore] = useState("")
  const [feedback, setFeedback] = useState("")
  const [grading, setGrading] = useState(false)

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const data = await teacherApi.getSubmission(submissionId)
        if (!alive) return
        setSubmission(data)
        setScore(data.score != null ? String(data.score) : "")
        setFeedback(data.feedback ?? "")
      } catch {
        if (alive) notify.error(null, "No se pudo cargar la entrega")
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [submissionId])

  const loadFile = async (path: string) => {
    setSelectedFile(path)
    setLoadingFile(true)
    try {
      const data = await teacherApi.getSubmissionFile(submissionId, path)
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
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > (submission?.activity.maxScore ?? 100)) {
      notify.error(null, `La calificación debe ser un entero entre 0 y ${submission?.activity.maxScore ?? 100}`)
      return
    }
    setGrading(true)
    try {
      await teacherApi.gradeSubmission(submissionId, parsed, feedback || undefined)
      notify.success("Calificación guardada")
      onGraded?.()
      onClose()
    } catch (e) {
      notify.error(e, "No se pudo guardar la calificación")
    } finally {
      setGrading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="rounded-xl bg-background p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!submission) return null

  const tree = submission.evidence.tree ?? []
  const statusTone =
    submission.status === "graded"
      ? "emerald"
      : submission.status === "submitted"
        ? "amber"
        : "neutral"

  return (
    <div className="fixed inset-0 z-50 flex items-stretch bg-black/50">
      <div className="ml-auto flex h-full w-full max-w-4xl flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver
            </button>
            <div>
              <h2 className="text-sm font-medium text-foreground">
                {submission.student.name}
                {submission.student.code && (
                  <span className="ml-2 font-mono text-muted-foreground">
                    ({submission.student.code})
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                Entregado: {formatBogotaDateTime(submission.submittedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tag tone={statusTone}>
              {submission.status === "graded"
                ? `Calificada: ${submission.score}/${submission.activity.maxScore}`
                : submission.status === "submitted"
                  ? "Pendiente"
                  : submission.status}
            </Tag>
            <a
              href={`/api/submissions/${submissionId}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar
            </a>
          </div>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1">
          {/* Sidebar: file tree */}
          <div className="w-60 shrink-0 overflow-y-auto border-r border-border p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
              Archivos ({tree.length})
            </p>
            <div className="space-y-0.5">
              {tree.map((path) => {
                const isDir = path.endsWith("/")
                const name = path.split("/").filter(Boolean).pop() ?? path
                return (
                  <button
                    key={path}
                    type="button"
                    onClick={() => !isDir && loadFile(path)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors",
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
                )
              })}
            </div>
          </div>

          {/* Center: file content */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center border-b border-border px-4 py-2">
              <span className="font-mono text-xs text-muted-foreground">
                {selectedFile ?? "Selecciona un archivo"}
              </span>
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

        {/* Footer: grading */}
        {submission.status !== "graded" && (
          <div className="shrink-0 border-t border-border px-6 py-4">
            <div className="flex gap-4">
              <div className="w-32 space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Calificación (/{submission.activity.maxScore})
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={submission.activity.maxScore}
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
      </div>
    </div>
  )
}
