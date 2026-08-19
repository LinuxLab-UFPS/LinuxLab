"use client"

import { useState } from "react"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, FileText, Folder, ChevronDown, ChevronRight, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { ActionButton } from "@shared/components/action-button"
import { Input } from "@shared/components/ui/input"
import { Textarea } from "@shared/components/ui/textarea"
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

/** Color de la nota según la escala del curso: rojo < 60, ámbar >= 60, verde >= 80. */
function scoreColor(score: number) {
  if (score >= 80) return "text-success"
  if (score >= 60) return "text-warning"
  return "text-danger"
}

function StatusBadge({ detail }: { detail: StudentActivityDetailType }) {
  if (detail.type === "manual") {
    if (!detail.submission) return <Tag tone="muted">Sin entrega</Tag>
    return detail.submission.status === "graded" ? (
      <Tag tone="emerald">Calificada</Tag>
    ) : (
      <Tag tone="amber">Pendiente por calificar</Tag>
    )
  }
  return detail.attempts.length > 0 ? (
    <Tag tone="emerald">Calificada</Tag>
  ) : (
    <Tag tone="muted">Sin intentos</Tag>
  )
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
  const submittedAt =
    detail.type === "manual"
      ? submission?.submittedAt
      : attempts.length > 0
        ? attempts[attempts.length - 1].createdAt
        : null

  const manualSubmission = detail.type === "manual" ? detail.submission : null
  const feedback =
    detail.type === "manual"
      ? (submission?.feedback ?? "")
      : ""
  const showGradeForm =
    detail.type === "manual" && isTeacher && manualSubmission != null && manualSubmission.status !== "graded"
  const [scoreInput, setScoreInput] = useState(
    manualSubmission?.score != null ? String(manualSubmission.score) : "",
  )
  const [feedbackInput, setFeedbackInput] = useState(manualSubmission?.feedback ?? "")
  const [grading, setGrading] = useState(false)
  const queryClient = useQueryClient()

  const handleGrade = async () => {
    if (!manualSubmission) return
    const parsed = Number(scoreInput)
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
      notify.error(null, "La calificación debe ser un entero entre 0 y 100")
      return
    }
    setGrading(true)
    try {
      await teacherApi.gradeSubmission(manualSubmission.id, parsed, feedbackInput || undefined)
      queryClient.invalidateQueries({ queryKey: queryKeys.gradebook(groupId) })
      queryClient.invalidateQueries({
        queryKey: queryKeys.studentPerformance(groupId, student.id),
      })
      notify.success("Calificación guardada")
    } catch (e) {
      notify.error(e, "No se pudo guardar la calificación")
    } finally {
      setGrading(false)
    }
  }

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
            <Tag tone="brand">{activity.activityType === "quiz" ? "Quiz" : "Taller"}</Tag>
            <Tag tone="brand">
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
                <td className="px-4 py-2.5 font-medium text-foreground w-56">Fecha de entrega</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {submittedAt ? formatBogotaDateTime(submittedAt) : "—"}
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-4 py-2.5 font-medium text-foreground w-56">Estado de la calificación</td>
                <td className="px-4 py-2.5">
                  <StatusBadge detail={detail} />
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-4 py-2.5 font-medium text-foreground w-56">Calificación</td>
                <td className="px-4 py-2.5">
                  {showGradeForm ? (
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={scoreInput}
                      onChange={(e) => setScoreInput(e.target.value)}
                      className="w-32 border-table-line font-mono"
                    />
                  ) : score != null ? (
                    <span className={cn("font-mono text-sm font-medium", scoreColor(score))}>
                      {score}/{activity.maxScore}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-foreground w-56">Retroalimentación</td>
                <td className={cn("px-4 py-2.5", (showGradeForm || detail.type === "automatic") && "align-top")}>
                  {showGradeForm ? (
                    <Textarea
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      placeholder="Comentarios para el estudiante..."
                      className="h-28 resize-none overflow-y-auto border-table-line text-sm"
                    />
                  ) : detail.type === "automatic" ? (
                    <AutomaticFeedback detail={detail} />
                  ) : feedback ? (
                    <p className="whitespace-pre-wrap text-muted-foreground">{feedback}</p>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {showGradeForm && (
          <div className="mt-3 flex justify-end">
            <ActionButton tone="primary" onClick={handleGrade} disabled={grading}>
              {grading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Calificar
            </ActionButton>
          </div>
        )}
      </div>

      {detail.type === "manual" ? (
        <ManualDetail detail={detail} />
      ) : (
        <AutomaticDetail detail={detail} />
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

function countFiles(node: TreeNode): number {
  if (!node.isDir) return 1
  return (node.children ?? []).reduce((acc, child) => acc + countFiles(child), 0)
}

function FileTreeNode({
  node,
  selectedFile,
  onSelect,
  collapsed,
  onToggleCollapse,
  depth = 0,
}: {
  node: TreeNode
  selectedFile: string | null
  onSelect: (path: string) => void
  collapsed: Set<string>
  onToggleCollapse: (path: string) => void
  depth?: number
}) {
  return (
    <div>
      <div className={cn("group flex items-center", depth > 0 && "ml-3")}>
        {node.isDir ? (
          <button
            type="button"
            onClick={() => onToggleCollapse(node.path)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-foreground transition-colors hover:bg-primary/10"
          >
            {collapsed.has(node.path) ? (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-primary" />
            )}
            <Folder className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="font-medium">{node.name}</span>
            {collapsed.has(node.path) && (
              <span className="text-xs text-muted-foreground">({countFiles(node)})</span>
            )}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onSelect(node.path)}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors",
                selectedFile === node.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
              )}
            >
              <FileText
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  selectedFile === node.path ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span className="truncate font-mono text-sm">{node.name}</span>
            </button>
          </>
        )}
      </div>
      {!collapsed.has(node.path) &&
        node.children?.map((child) => (
          <FileTreeNode
            key={child.path}
            node={child}
            selectedFile={selectedFile}
            onSelect={onSelect}
            collapsed={collapsed}
            onToggleCollapse={onToggleCollapse}
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
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const toggleCollapse = (path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }
  const nodes = buildTree(tree)
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          selectedFile={selectedFile}
          onSelect={onSelect}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      ))}
    </div>
  )
}

function ManualDetail({ detail }: { detail: Extract<StudentActivityDetailType, { type: "manual" }> }) {
  const { submission } = detail
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState("")
  const [loadingFile, setLoadingFile] = useState(false)

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
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            <FileText
              className={cn("h-3.5 w-3.5 shrink-0", selectedFile ? "text-primary" : "text-muted-foreground")}
            />
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
    </div>
  )
}

/** Checks de la mejor entrega de una actividad automática, según su política.
 * La retroalimentación descriptiva de cada check la construye el checker
 * (backend), así que aquí solo se muestra `detail` tal cual viene. */
function AutomaticFeedback({
  detail,
}: {
  detail: Extract<StudentActivityDetailType, { type: "automatic" }>
}) {
  if (detail.attempts.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  const policy = detail.activity.gradingPolicy
  const bestAttempt =
    policy === "latest_score"
      ? detail.attempts.reduce((a, b) =>
          new Date(a.createdAt) > new Date(b.createdAt) ? a : b,
        )
      : detail.attempts.reduce((a, b) => (b.score > a.score ? b : a))

  return (
    <div className="space-y-3">
      {bestAttempt.results.map((r) => (
        <div key={r.id} className="flex items-start gap-2.5 text-sm">
          {r.passed ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          )}
          <span className="flex-1 text-foreground">{r.detail}</span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {r.passed ? r.points : 0}/{r.points}
          </span>
        </div>
      ))}
    </div>
  )
}

function AutomaticDetail({
  detail,
}: {
  detail: Extract<StudentActivityDetailType, { type: "automatic" }>
}) {
  if (detail.attempts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-background p-8 text-center">
        <p className="text-sm text-muted-foreground">Este estudiante aún no ha intentado la actividad.</p>
      </div>
    )
  }

  const maxScore = detail.activity.maxScore

  return (
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
              <tr key={a.attemptNumber} className="border-b border-border/50 bg-background last:border-0">
                <td className="px-4 py-2.5 text-center font-mono text-sm text-foreground">{a.attemptNumber}</td>
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
                <td className="px-4 py-2.5 text-center font-mono text-sm text-foreground">{a.score}/{maxScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
