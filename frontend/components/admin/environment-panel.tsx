"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, TerminalSquare } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { apiFetch } from "@/lib/api/client"
import { ActionButton } from "@/components/shared/action-button"
import { TablePanel, TableEmptyState } from "@/components/shared/data-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Snapshot {
  accounts: {
    inDatabase: number
    inContainer: number
    missing: { username: string; name: string; email: string; role: string }[]
    orphans: string[]
  }
  courses: {
    id: string
    name: string
    groupName: string
    teacher: string | null
    hasUnixGroup: boolean
    hasDir: boolean
  }[]
  jobs: {
    users: Record<string, number>
    groups: Record<string, number>
  }
}

function Metric({
  label,
  value,
  bad,
}: {
  label: string
  value: number | string
  bad?: boolean
}) {
  return (
    <div className="rounded-xl border border-table-line px-5 py-4">
      <p
        className={cn(
          "font-mono text-2xl font-semibold leading-none",
          bad ? "text-danger" : "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function Ok({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-sm text-success">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Sí
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-sm text-danger">
      <AlertCircle className="h-3.5 w-3.5" />
      Falta
    </span>
  )
}

/**
 * Lo que dice la base contra lo que hay dentro del entorno, y las dos acciones
 * para cuadrarlo. No hay consola: las operaciones son fijas y pasan por el
 * backend, que es quien tiene la cuenta con privilegios.
 */
export function EnvironmentPanel() {
  const [data, setData] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    return apiFetch<Snapshot>("/api/admin/environment")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo leer el entorno"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const run = async (action: string, path: string, done: (r: never) => string) => {
    setBusy(action)
    try {
      const result = await apiFetch<never>(path, { method: "POST" })
      toast.success(done(result))
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "La operación falló")
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-table-line py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
        {error ?? "Sin datos"}
      </div>
    )
  }

  const { accounts, courses, jobs } = data
  const brokenCourses = courses.filter((c) => !c.hasUnixGroup || !c.hasDir)
  const failedJobs = (jobs.users.failed ?? 0) + (jobs.groups.failed ?? 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Cuentas en la base" value={accounts.inDatabase} />
        <Metric label="Cuentas en el entorno" value={accounts.inContainer} />
        <Metric
          label="Cuentas que faltan"
          value={accounts.missing.length}
          bad={accounts.missing.length > 0}
        />
        <Metric label="Trabajos fallidos" value={failedJobs} bad={failedJobs > 0} />
      </div>

      <div className="flex flex-wrap gap-3">
        <ActionButton
          tone="violet"
          disabled={busy !== null}
          onClick={() =>
            run(
              "reconcile",
              "/api/admin/linux-accounts/reconcile",
              (r: { orphaned: number; requeued: number }) =>
                `${r.orphaned} cuentas huérfanas, ${r.requeued} reencoladas`,
            )
          }
        >
          <RefreshCw className={cn("h-4 w-4", busy === "reconcile" && "animate-spin")} />
          Reconciliar cuentas
        </ActionButton>

        <ActionButton
          tone="neutral"
          disabled={busy !== null}
          onClick={() =>
            run(
              "requeue",
              "/api/admin/environment/requeue",
              (r: { users: number; groups: number }) =>
                `${r.users} trabajos de cuenta y ${r.groups} de curso reencolados`,
            )
          }
        >
          <RefreshCw className={cn("h-4 w-4", busy === "requeue" && "animate-spin")} />
          Reintentar trabajos fallidos
        </ActionButton>

        <ActionButton
          tone="neutral"
          disabled={busy !== null}
          onClick={() =>
            run("account", "/api/admin/environment/account", (r: { created: boolean; username: string }) =>
              r.created
                ? `Creando tu cuenta ${r.username} en el entorno`
                : `Ya tienes cuenta: ${r.username}`,
            )
          }
        >
          <TerminalSquare className="h-4 w-4" />
          Mi cuenta del entorno
        </ActionButton>
      </div>

      <section>
        <h2 className="mb-2.5 text-sm font-medium text-muted-foreground">Cursos activos</h2>
        <TablePanel>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Curso</TableHead>
                <TableHead className="w-44">Docente</TableHead>
                <TableHead className="w-36">Grupo Unix</TableHead>
                <TableHead className="w-36">Carpeta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <span className="block text-sm font-medium text-foreground">
                      {course.name}
                    </span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {course.groupName}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {course.teacher ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Ok ok={course.hasUnixGroup} />
                  </TableCell>
                  <TableCell>
                    <Ok ok={course.hasDir} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {courses.length === 0 && <TableEmptyState>No hay cursos activos.</TableEmptyState>}
        </TablePanel>
        {brokenCourses.length > 0 && (
          <p className="mt-2 text-xs text-danger">
            {brokenCourses.length} curso(s) sin su grupo o su carpeta: reintenta los trabajos
            fallidos.
          </p>
        )}
      </section>

      {(accounts.missing.length > 0 || accounts.orphans.length > 0) && (
        <section className="grid gap-6 lg:grid-cols-2">
          {accounts.missing.length > 0 && (
            <div>
              <h2 className="mb-2.5 text-sm font-medium text-muted-foreground">
                En la base pero no en el entorno
              </h2>
              <TablePanel>
                <Table>
                  <TableBody>
                    {accounts.missing.map((a) => (
                      <TableRow key={a.username}>
                        <TableCell>
                          <span className="block font-mono text-sm text-foreground">
                            {a.username}
                          </span>
                          <span className="block text-xs text-muted-foreground">{a.email}</span>
                        </TableCell>
                        <TableCell className="w-28 text-sm text-muted-foreground">
                          {a.role}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TablePanel>
            </div>
          )}

          {accounts.orphans.length > 0 && (
            <div>
              <h2 className="mb-2.5 text-sm font-medium text-muted-foreground">
                En el entorno pero no en la base
              </h2>
              <TablePanel>
                <Table>
                  <TableBody>
                    {accounts.orphans.map((username) => (
                      <TableRow key={username}>
                        <TableCell className="font-mono text-sm text-foreground">
                          {username}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TablePanel>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
