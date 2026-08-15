"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Send, Users } from "lucide-react"
import { ActionButton } from "@shared/components/action-button"
import { Input } from "@shared/components/ui/input"
import { Label } from "@shared/components/ui/label"
import { Textarea } from "@shared/components/ui/textarea"
import { Stepper, type Step } from "@shared/components/stepper"
import { StudentManager, type DraftStudent } from "@/lib/features/teacher/components/student-manager"
import { createGroup } from "@/lib/features/teacher/data"
import { RoleGuard } from "@shared/components/role-guard"
import { dismissToast, hasToast, notify, notifyLoading, notifyPromise } from "@shared/lib/toast"

const PASOS: Step[] = [
  { id: "curso", label: "Información" },
  { id: "estudiantes", label: "Estudiantes" },
  { id: "confirmar", label: "Confirmar y publicar" },
]

const TITULO = [
  "Información del curso",
  "Estudiantes",
  "Revisa antes de publicar",
]

const ENTRADILLA = [
  "El nombre con el que tus estudiantes verán el curso.",
  "Quiénes lo van a cursar. Puedes agregarlos uno a uno o cargar un CSV, y también hacerlo más tarde.",
  "Comprueba que todo esté como lo quieres. Al publicar se crean las cuentas de los estudiantes en el entorno.",
]

function CreateGroupContent() {
  const router = useRouter()
  const [paso, setPaso] = useState(0)
  const [groupName, setGroupName] = useState("")
  const [description, setDescription] = useState("")
  const [students, setStudents] = useState<DraftStudent[]>([])
  const [publishing, setPublishing] = useState(false)
  const addStudent = (student: Omit<DraftStudent, "id">) => {
    setStudents((prev) => [...prev, { ...student, id: crypto.randomUUID() }])
  }

  const addStudents = (rows: Omit<DraftStudent, "id">[]) => {
    setStudents((prev) => [...prev, ...rows.map((r) => ({ ...r, id: crypto.randomUUID() }))])
  }

  const removeStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id))
  }

  // El nombre se exige aquí y no al publicar: dejar avanzar para frenar al
  // final obliga a rehacer el camino de vuelta.
  const avanzar = () => {
    if (paso === 0 && !groupName.trim()) {
      notify.error(null, "El nombre del curso es requerido.")
      return
    }
    setPaso((p) => Math.min(p + 1, PASOS.length - 1))
  }

  const retroceder = () => {
    setPaso((p) => Math.max(p - 1, 0))
  }

  const handlePublish = async () => {
    setPublishing(true)
    const response = await notifyPromise(createGroup({
      name: groupName,
      description,
      students: students.map((s) => ({ name: s.name, email: s.email, code: s.code })),
    }), {
      loading: "Publicando el curso…",
      success: "Curso publicado",
      description: (r) => {
        const parts: string[] = []
        if (r.enrollment.registered) parts.push(`${r.enrollment.registered} inscrito(s)`)
        if (r.enrollment.skipped) parts.push(`${r.enrollment.skipped} ya inscrito(s)`)
        if (r.enrollment.errors.length) parts.push(`${r.enrollment.errors.length} con error`)
        return parts.length ? parts.join(", ") : "sin estudiantes"
      },
      error: "No se pudo publicar el curso.",
    })
    setPublishing(false)
    if (!response.ok) return
    const published = response.data

    if (published.enrollment.registered > 0) {
      const toastId = `prov-${published.group.id}`
      notifyLoading(`Creando cuentas en el entorno… 0/${published.enrollment.registered}`, { id: toastId })
      // Red de seguridad: si el docente no entra al curso, el toast de carga
      // no debe quedarse girando para siempre.
      setTimeout(() => {
        if (hasToast(toastId)) {
          dismissToast(toastId)
        }
      }, 3 * 60 * 1000)
    }

    router.push(`/groups/${published.group.id}`)
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <ActionButton tone="neutral" href="/home">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </ActionButton>

      <Stepper
        steps={PASOS}
        current={paso}
        onSelect={setPaso}
        orientation="horizontal"
        className="mt-8"
      />

      <div className="mt-10">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-foreground">{TITULO[paso]}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {ENTRADILLA[paso]}
          </p>

          <div className="mt-8">
            {paso === 0 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="groupName" className="text-muted-foreground">
                    Nombre del curso
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
                    placeholder="Breve descripción del curso…"
                    className="resize-none border-table-line"
                  />
                </div>
              </div>
            )}

            {paso === 1 && (
              <StudentManager
                students={students}
                onAdd={addStudent}
                onAddMany={addStudents}
                onRemove={removeStudent}
              />
            )}

            {paso === 2 && (
              <dl className="divide-y divide-table-line rounded-lg border border-table-line">
                <div className="flex gap-4 px-4 py-3">
                  <dt className="w-32 shrink-0 text-sm text-muted-foreground">Nombre</dt>
                  <dd className="text-sm text-foreground">{groupName}</dd>
                </div>
                <div className="flex gap-4 px-4 py-3">
                  <dt className="w-32 shrink-0 text-sm text-muted-foreground">Descripción</dt>
                  <dd className="text-sm text-foreground">
                    {description.trim() || (
                      <span className="text-muted-foreground">Sin descripción</span>
                    )}
                  </dd>
                </div>
                <div className="flex gap-4 px-4 py-3">
                  <dt className="w-32 shrink-0 text-sm text-muted-foreground">Estudiantes</dt>
                  <dd className="flex items-center gap-2 text-sm text-foreground">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {students.length === 0
                      ? "Ninguno por ahora"
                      : `${students.length} por inscribir`}
                  </dd>
                </div>
              </dl>
            )}
          </div>

          <div className="mt-10 flex items-center gap-3">
            {paso > 0 && (
              <ActionButton tone="neutral" onClick={retroceder} disabled={publishing}>
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </ActionButton>
            )}

            {paso < PASOS.length - 1 ? (
              <ActionButton tone="primary" onClick={avanzar}>
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </ActionButton>
            ) : (
              <ActionButton tone="primary" onClick={handlePublish} disabled={publishing}>
                <Send className="h-4 w-4" />
                {publishing ? "Publicando..." : "Publicar curso"}
              </ActionButton>
            )}
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
