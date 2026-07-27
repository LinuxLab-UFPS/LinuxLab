"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listGroups } from "@/lib/features/teacher/data"
import { GroupsTable } from "@/components/teacher/groups-table"
import type { Group } from "@/lib/features/teacher/types"

export function TeacherDashboard() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listGroups()
      .then(setGroups)
      .catch((e) => setError(e instanceof Error ? e.message : "Error al cargar cursos"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            <span className="bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent">
              Cursos
            </span>
          </h1>
          <span className="mt-3 block h-1 w-24 rounded-full bg-gradient-to-r from-sky-400 to-sky-600" />
          <p className="mt-4 max-w-xl text-muted-foreground">
            Gestiona tus cursos, revisa el progreso de tus estudiantes y sus actividades.
          </p>
        </div>
        <Link href="/create-group" className="shrink-0">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow">
            <Plus className="mr-2 h-4 w-4" />
            Crear nuevo curso
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-black/15 py-20 dark:border-border">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <GroupsTable initialGroups={groups} />
      )}
    </div>
  )
}
