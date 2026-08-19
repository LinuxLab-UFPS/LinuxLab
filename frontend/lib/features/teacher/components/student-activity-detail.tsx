"use client"

import { useState } from "react"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, FileText, Folder, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { ActionButton } from "@shared/components/action-button"
import { Input } from "@shared/components/ui/input"
import { Textarea } from "@shared/components/ui/textarea"
import { Label } from "@shared/components/ui/label"
import { Tag } from "@shared/components/tag"
import { notify } from "@shared/lib/toast"
import { formatBogotaDateTime } from "@/lib/utils/dates"
import { teacherApi } from "@/lib/features/teacher/api"
import { queryKeys } from "@/lib/api/queries"
import type { StudentActivityDetail as StudentActivityDetailType } from "@/lib/features/teacher/types"

interface Props {
  detail: StudentActivityDetailType
  groupId: string
  backHref: string
  isTeacher: boolean
}

export function StudentActivityDetail({ detail, groupId, backHref, isTeacher }: Props) {
  const { student, activity } = detail
  const submission = detail.type === "manual" ? detail.submission : null
  const attempts = detail.type === "automatic" ? detail.attempts : []

  // La nota vive unicamente en la tabla de info: manuales y automaticas
  // alimentan los mismos campos (nota, estado y fecha de entrega).
  const score =
    detail.type === "manual"
      ? submission?.score ?? null
      : attempts.length > 0
        ? detail.finalScore
        : null
  const graded =
    detail.type === "manual"
      ? submission?.status === "graded" && submission.score != null
      : attempts.length > 0
  const pendingManual =
    detail.type === "manual" && submission != null && submission.status !== "graded"
  const submittedAt =
    detail.type === "manual"
      ? submission?.submittedAt
      : attempts.length > 0
        ? attempts[attempts.length - 1].createdAt
        : null

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </Link>

        <div className="mt-4">
          <h1 className="text-lg font-bold tracking-tight text-foreground">{activity.title}</h1>
          {activity.instructions && (
            <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">{activity.instructions}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Tag tone="neutral">{activity.activityType === "quiz" ? "Quiz" : "Taller"}</Tag>
            <Tag tone="neutral">
              {activity.evaluationType === "manual" ? "Revisión manual" : "Autoevaluación"}
            </Tag>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-border/50">
                <td className="px-4 py-2.5 font-medium text-foreground w-56">Nombre del estudiante</td>
                <td className="px-4 py-2.5 text-muted-foreground">{student.name}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-4 py-2.5 font-medium text-foreground w-56">Código del estudiante</td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{student.code ?? "—"}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-4 py-2.5 font-medium text-foreground w-56">Estado de la calificación</td>
                <td className="px-4 py-2.5">
                  {graded && score != null ? (
                    <Tag
                      tone={score >= 80 ? "emerald" : score >= 60 ? "amber" : "rose"}
                    >
                      <span className="text-sm">
                        Calificación: {score}/{activity.maxScore}
                      </span>
                    </Tag>
                  ) : pendingManual ? (
                    <Tag tone="amber">Pendiente por calificar</Tag>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-foreground w-56">Fecha de entrega</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {submittedAt ? formatBogotaDateTime(submittedAt) : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {detail.type === "manual" ? (
        <ManualDetail detail={detail} groupId={groupId} isTeacher={isTeacher} />
      ) : (
        <AutomaticDetail detail={detail} maxScore={activity.maxScore} />
      )}
    </div>
  )
}

interface TreeNode {
  name: string
  path: string
  isDir: boolean
  children?: TreeNode[]
}

function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = []
  for (const path of paths) {
    const parts = path.split("/").filter(Boolean)
    let current = root
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]
      const isLast = i === parts.length - 1
      const existing = current.find((n) => n.name === name)
      if (existing) {
        if (!isLast) current = existing.children!
      } else {
        const node: TreeNode = {
          name,
          path: isLast ? path : parts.slice(0, i + 1).join("/") + "/",
          isDir: !isLast,
          children: isLast ? undefined : [],
        }
        current.push(node)
        if (!isLast) current = node.children!
      }
    }
  }
  return root
}

function FileTreeNode({
  node,
  selectedFile,
  onSelect,
  depth = 0,
}: {
  node: TreeNode
  selectedFile: string | null
  onSelect: (path: string) => void
  depth?: number
}) {
  return (
    <div>
      <div className={cn("group flex items-center", depth > 0 && "ml-3")}>
        {node.isDir ? (
          <span className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-foreground">
            <Folder className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">{node.name}</span>
          </span>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onSelect(node.path)}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors",
                selectedFile === node.path
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
              )}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate font-mono text-sm">{node.name}</span>
            </button>
          </>
        )}
      </div>
      {node.children?.map((child) => (
        <FileTreeNode
          key={child.path}
          node={child}
          selectedFile={selectedFile}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

function FileTree({
  tree,
  selectedFile,
  onSelect,
}: {
  tree: string[]
  selectedFile: string | null
  onSelect: (path: string) => void
}) {
  const nodes = buildTree(tree)
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          selectedFile={selectedFile}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function ManualDetail({
  detail,
  groupId,
  isTeacher,
}: {
  detail: Extract<StudentActivityDetailType, { type: "manual" }>
  groupId: string
  isTeacher: boolean
}) {
  const { submission } = detail
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState("")
  const [loadingFile, setLoadingFile] = useState(false)
  const [score, setScore] = useState(submission?.score != null ? String(submission.score) : "")
  const [feedback, setFeedback] = useState(submission?.feedback ?? "")
  const [grading, setGrading] = useState(false)
  const queryClient = useQueryClient()

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
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
      notify.error(null, "La calificación debe ser un entero entre 0 y 100")
      return
    }
    setGrading(true)
    try {
      await teacherApi.gradeSubmission(submission!.id, parsed, feedback || undefined)
      queryClient.invalidateQueries({ queryKey: queryKeys.gradebook(groupId) })
      queryClient.invalidateQueries({
        queryKey: queryKeys.studentPerformance(groupId, detail.student.id),
      })
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
      <div className="flex min-h-[400px] overflow-hidden rounded-xl border border-border">
        <div className="w-60 shrink-0 overflow-y-auto border-r border-border bg-background p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
            Archivos ({tree.length})
          </p>
          <FileTree
            tree={tree}
            selectedFile={selectedFile}
            onSelect={loadFile}
          />
        </div>

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

      {isTeacher && submission.status !== "graded" && (
        <div className="rounded-xl border border-border bg-background p-4">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase">Calificación</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Calificación (0-100)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-32 border-table-line font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Retroalimentación</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder="Comentarios para el estudiante..."
                className="border-table-line text-sm"
              />
            </div>
            <div>
              <ActionButton tone="primary" onClick={handleGrade} disabled={grading}>
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
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border bg-card px-4 py-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Intentos ({detail.attempts.length})
          </p>
        </div>
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
