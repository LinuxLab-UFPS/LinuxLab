"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  GraduationCap,
  Mail,
  ShieldAlert,
} from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { RoleGuard } from "@shared/components/role-guard"
import { ActionButton } from "@shared/components/action-button"
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@shared/components/ui/dialog"
import { X } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { TablePanel, TableEmptyState } from "@shared/components/data-table"
import { Skeleton, SkeletonScreen } from "@shared/components/skeleton"
import { finalizeGroup } from "@/lib/features/teacher/data"
import { queryKeys, useFinalizePreview } from "@/lib/api/queries"
import { notify } from "@shared/lib/toast"

/**
 * La vista de finalización es el acta de cierre del curso: muestra la regla
 * consolidada aplicada a cada estudiante (temas y definitiva), quién será
 * certificado y pide la confirmación que dispara los certificados y los
 * correos. Es irreversible: detrás no hay vuelta atrás.
 */
function FinalizePageContent() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params?.id ?? ""
  const [confirming, setConfirming] = useState(false)

  const previewQuery = useFinalizePreview(id)
  const preview = previewQuery.data ?? null

  const finalizeMutation = useMutation({
    mutationFn: () => finalizeGroup(id),
    onSuccess: (outcome) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups })
      queryClient.invalidateQueries({ queryKey: queryKeys.group(id) })
      notify.success("Curso finalizado", {
        description: `Se emitieron ${outcome.summary.certificatesIssued} certificado(s) y los correos están en camino.`,
      })
      router.push(`/grupos/${id}`)
    },
    onError: () => {
      notify.error(null, "No se pudo finalizar el curso.")
      setConfirming(false)
    },
  })

  if (previewQuery.isLoading) {
    return (
      <SkeletonScreen className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-4 h-24 w-full" />
        <Skeleton className="mt-6 h-64 w-full" />
      </SkeletonScreen>
    )
  }

  if (!preview) {
    // El backend responde 409 si el grupo ya no está activo: la vista previa
    // solo tiene sentido antes de finalizar.
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/60">
          <ShieldAlert className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="mb-1 text-base font-medium text-foreground">
          Este curso ya no se puede finalizar
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Solo los cursos activos se pueden finalizar, o ya pasó por ello.
        </p>
        <Link href={`/grupos/${id}`}>
          <Button variant="outline">Volver al curso</Button>
        </Link>
      </div>
    )
  }

  const { students, summary } = preview
  const pendingManualNames = Array.from(
    new Set(students.flatMap((s) => s.pendingManual)),
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <ActionButton tone="neutral" href={`/grupos/${id}`}>
        <ArrowLeft className="h-4 w-4" />
        Volver al curso
      </ActionButton>

      <div className="mb-6 mt-9">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          <GraduationCap className="h-7 w-7 text-primary" />
          Finalizar curso
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {preview.group.name} · Revisa el cierre antes de confirmar: esta acción no se
          puede deshacer.
        </p>
      </div>

      {/* Resumen del criterio */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-table-line bg-card p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {summary.eligibleCount} de {summary.total}
              </p>
              <p className="text-sm text-muted-foreground">
                estudiantes serán certificados con la regla consolidada
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-table-line bg-card p-5">
          <p className="mb-2 text-sm font-semibold text-foreground">Regla de certificación</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>· Todos los temas del temario completados (lecturas, comprobaciones y actividades).</li>
            <li>· Definitiva de actividades de 60 o más (promedio del último intento).</li>
          </ul>
        </div>
      </div>

      {pendingManualNames.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-500">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Hay entregas manuales sin calificar que cuentan como 0 en la definitiva:{" "}
            <span className="font-medium">{pendingManualNames.join(", ")}</span>. Califícalas
            antes de finalizar si quieres que puntúen.
          </p>
        </div>
      )}

      {/* Tabla de cierre */}
      <TablePanel>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Estudiante</TableHead>
              <TableHead className="w-24">Código</TableHead>
              <TableHead className="w-44">Progreso</TableHead>
              <TableHead className="w-28">Definitiva</TableHead>
              <TableHead className="w-56">Certificado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.enrollmentId}>
                <TableCell>
                  <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {s.code ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full ${s.progress === 100 ? "bg-primary" : "bg-primary/60"}`}
                        style={{ width: `${s.progress}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right font-mono text-xs text-muted-foreground">
                      {s.progress}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm text-foreground">
                  {s.definitive ?? "—"}
                </TableCell>
                <TableCell>
                  {s.eligible ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      Sí
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No · {s.motivo ?? "no cumple la regla"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {students.length === 0 && (
          <TableEmptyState>Este curso no tiene estudiantes matriculados.</TableEmptyState>
        )}
      </TablePanel>

      {/* Confirmación */}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-end">
        <p className="text-xs text-muted-foreground sm:mr-auto">
          Al finalizar se destruye el entorno Linux del grupo y los estudiantes quedan
          liberados para matricularse en otro curso.
        </p>
        <Button
          type="button"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={finalizeMutation.isPending || students.length === 0}
          onClick={() => setConfirming(true)}
        >
          <GraduationCap className="h-4 w-4" />
          Confirmar finalización
        </Button>
      </div>

      <Dialog open={confirming} onOpenChange={(open) => !open && !finalizeMutation.isPending && setConfirming(false)}>
        <DialogContent showCloseButton={false} className="gap-0 p-0 sm:max-w-md">
          <div className="flex items-center justify-between gap-4 border-b border-table-line px-4 py-3">
            <DialogTitle className="truncate text-sm font-semibold">
              Finalizar «{preview.group.name}»
            </DialogTitle>
            <DialogClose
              aria-label="Cerrar"
              className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <X className="h-4 w-4" />
            </DialogClose>
          </div>

          <div className="px-6 py-5">
            <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </span>
            <p className="text-center text-sm leading-relaxed text-muted-foreground">
              Se emitirán <span className="font-semibold text-foreground">{summary.eligibleCount}</span> certificado(s)
              de <span className="font-semibold text-foreground">{summary.total}</span> estudiante(s)
              y se enviarán al correo de cada uno, junto con su enlace de verificación.
            </p>
            <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
              El acta del curso y tu certificado de instructor llegarán a tu correo.
            </p>
            <p className="mt-3 text-center text-sm font-medium text-danger">
              El entorno del curso se elimina y la finalización no se puede deshacer.
            </p>

            <button
              type="button"
              disabled={finalizeMutation.isPending}
              onClick={() => finalizeMutation.mutate()}
              className="mt-5 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {finalizeMutation.isPending
                ? "Finalizando..."
                : `Finalizar y emitir ${summary.eligibleCount} certificado(s)`}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function FinalizeGroupPage() {
  return (
    <RoleGuard roles={["teacher", "admin"]}>
      <FinalizePageContent />
    </RoleGuard>
  )
}
