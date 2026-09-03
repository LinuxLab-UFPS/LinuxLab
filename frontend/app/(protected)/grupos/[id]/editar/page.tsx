"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Pencil, Send, ShieldAlert } from "lucide-react"
import { ActionButton } from "@shared/components/action-button"
import { Button } from "@shared/components/ui/button"
import { RoleGuard } from "@shared/components/role-guard"
import { Skeleton, SkeletonScreen } from "@shared/components/skeleton"
import { GroupFormFields } from "@/lib/features/teacher/components/group-form-fields"
import { updateGroup } from "@/lib/features/teacher/data"
import { queryKeys, useGroup } from "@/lib/api/queries"
import { notify } from "@shared/lib/toast"
import type { Group } from "@/lib/features/teacher/types"

/**
 * Edición de los datos del grupo (nombre y descripcion), con el mismo
 * formulario de la creación. Solo los grupos activos son editables: el
 * backend responde 409 para finalizados y archivados, y aqui se anticipa
 * esa regla con un aviso en lugar del formulario.
 */
function EditGroupContent() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ""

  const groupQuery = useGroup(id)
  const group = groupQuery.data ?? null

  if (groupQuery.isLoading) {
    return (
      <SkeletonScreen className="mx-auto max-w-4xl px-8 py-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-4 h-12 w-full" />
        <Skeleton className="mt-6 h-64 w-full" />
      </SkeletonScreen>
    )
  }

  if (!group) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/60">
          <ShieldAlert className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="mb-1 text-base font-medium text-foreground">Grupo no encontrado</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Puede que el grupo ya no exista o que no tengas acceso a él.
        </p>
        <Link href="/inicio">
          <Button variant="outline">Volver al listado</Button>
        </Link>
      </div>
    )
  }

  if (group.status !== "active") {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/60">
          <ShieldAlert className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="mb-1 text-base font-medium text-foreground">
          Este curso ya no se puede editar
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Solo los cursos activos permiten cambiar su nombre y descripción: un curso
          finalizado o archivado conserva sus datos tal como se cerró.
        </p>
        <Link href={`/grupos/${id}`}>
          <Button variant="outline">Volver al curso</Button>
        </Link>
      </div>
    )
  }

  return <EditGroupForm group={group} />
}

/** Se monta solo cuando el grupo ya llegó: así el formulario se inicializa una
    sola vez con los datos reales y un refresco de la query no borra lo que el
    docente está escribiendo. */
function EditGroupForm({ group }: { group: Group }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description ?? "")

  const saveMutation = useMutation({
    mutationFn: () => updateGroup(group.id, { name, description }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups })
      queryClient.invalidateQueries({ queryKey: queryKeys.group(group.id) })
      notify.success("Grupo actualizado", {
        description: "Los cambios ya son visibles para tus estudiantes.",
      })
      router.push(`/grupos/${updated.id}`)
    },
    onError: () => {
      notify.error(null, "No se pudo guardar la información del grupo.")
    },
  })

  const handleSave = () => {
    if (!name.trim()) {
      notify.error(null, "El nombre del grupo es requerido.")
      return
    }
    saveMutation.mutate()
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <ActionButton tone="neutral" href={`/grupos/${group.id}`}>
        <ArrowLeft className="h-4 w-4" />
        Volver al curso
      </ActionButton>

      <div className="mt-10">
        <div className="min-w-0">
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-foreground">
            <Pencil className="h-6 w-6 text-primary" />
            Editar grupo
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Actualiza el nombre y la descripción con la que tus estudiantes ven el grupo.
          </p>

          <div className="mt-8">
            <GroupFormFields
              name={name}
              onNameChange={setName}
              description={description}
              onDescriptionChange={setDescription}
              disabled={saveMutation.isPending}
            />
          </div>

          <div className="mt-10">
            <ActionButton tone="primary" onClick={handleSave} disabled={saveMutation.isPending}>
              <Send className="h-4 w-4" />
              {saveMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EditGroupPage() {
  return (
    <RoleGuard roles={["teacher", "admin"]}>
      <EditGroupContent />
    </RoleGuard>
  )
}
