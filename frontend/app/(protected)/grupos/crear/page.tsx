"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Send } from "lucide-react"
import { ActionButton } from "@shared/components/action-button"
import { BackButton } from "@shared/components/back-button"
import { Input } from "@shared/components/ui/input"
import { Label } from "@shared/components/ui/label"
import { Textarea } from "@shared/components/ui/textarea"
import { createGroup } from "@/lib/features/teacher/data"
import { RoleGuard } from "@shared/components/role-guard"
import { queryKeys } from "@/lib/api/queries"
import { notify, notifyPromise } from "@shared/lib/toast"

function CreateGroupContent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [groupName, setGroupName] = useState("")
  const [description, setDescription] = useState("")
  const [publishing, setPublishing] = useState(false)

  const handlePublish = async () => {
    if (!groupName.trim()) {
      notify.error(null, "El nombre del grupo es requerido.")
      return
    }
    setPublishing(true)
    const response = await notifyPromise(
      createGroup({ name: groupName, description, students: [] }),
      {
        loading: "Creando el grupo…",
        success: "Grupo creado",
        description: "Después podrás invitar estudiantes con su enlace de inscripción.",
        error: "No se pudo crear el grupo.",
      },
    )
    setPublishing(false)
    if (!response.ok) return
    const published = response.data

    // El listado de grupos quedó viejo: al volver a /inicio el grupo nuevo debe
    // estar ahí sin esperar a que la caché expire.
    queryClient.invalidateQueries({ queryKey: queryKeys.groups })

    router.push(`/grupos/${published.group.id}`)
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <BackButton fallback="/inicio" />

      <div className="mt-10">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-foreground">Crear grupo</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            El nombre con el que tus estudiantes verán el grupo. Los estudiantes se agregan
            después, compartiendo el enlace de inscripción o matriculándolos uno a uno.
          </p>

          <div className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="groupName" className="text-muted-foreground">
                Nombre del grupo
              </Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ej: Sistemas Operativos - 2026-I"
                className="border-table-line"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-muted-foreground">
                Descripción
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Breve descripción del grupo…"
                className="resize-none border-table-line"
              />
            </div>
          </div>

          <div className="mt-10">
            <ActionButton tone="primary" onClick={handlePublish} disabled={publishing}>
              <Send className="h-4 w-4" />
              {publishing ? "Creando..." : "Crear grupo"}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreateGroupPage() {
  return (
    <RoleGuard roles={["teacher", "admin"]}>
      <CreateGroupContent />
    </RoleGuard>
  )
}