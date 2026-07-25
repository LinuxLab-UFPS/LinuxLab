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
      .catch((e) => setError(e instanceof Error ? e.message : "Error al cargar grupos"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Mis Grupos</h1>
          <p className="text-muted-foreground">Gestiona tus grupos y actividades</p>
        </div>
        <Link href="/create-group">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground neon-glow">
            <Plus className="w-4 h-4 mr-2" />
            Crear nuevo grupo
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 text-sm text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-card border border-border rounded-lg flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <GroupsTable initialGroups={groups} />
      )}
    </div>
  )
}
