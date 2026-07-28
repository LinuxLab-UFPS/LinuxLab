"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Users, UserCheck, UserX, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTeachers } from "@/lib/features/admin/hooks"
import { useAuth } from "@/lib/features/auth/context"

export function AdminDashboard() {
  const { user } = useAuth()
  const { teachers, loading } = useTeachers()
  const firstName = user?.name.split(" ")[0]

  const { activos, inactivos } = useMemo(
    () => ({
      activos: teachers.filter((t) => t.active).length,
      inactivos: teachers.filter((t) => !t.active).length,
    }),
    [teachers],
  )

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-1">
          Bienvenido{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Panel de administración de la plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Docentes totales</span>
          </div>
          <p className="text-3xl font-semibold text-foreground">
            {loading ? "…" : teachers.length}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            <span className="text-sm text-muted-foreground">Activos</span>
          </div>
          <p className="text-3xl font-semibold text-green-600">
            {loading ? "…" : activos}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <UserX className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Inactivos</span>
          </div>
          <p className="text-3xl font-semibold text-muted-foreground">
            {loading ? "…" : inactivos}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Gestión de Docentes
            </h2>
            <p className="text-sm text-muted-foreground">
              Administra los docentes registrados en la plataforma
            </p>
          </div>
          <Link href="/admin/docentes">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground neon-glow gap-2">
              Gestionar Docentes
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
