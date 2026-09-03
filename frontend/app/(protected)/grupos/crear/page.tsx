"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Send } from "lucide-react"
import { ActionButton } from "@shared/components/action-button"
import { BackButton } from "@shared/components/back-button"
import { createGroup } from "@/lib/features/teacher/data"
import { GroupFormFields } from "@/lib/features/teacher/components/group-form-fields"
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

          <div className="mt-8">
            <GroupFormFields
              name={groupName}
              onNameChange={setGroupName}
              description={description}
              onDescriptionChange={setDescription}
            />
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