"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Send, Users } from "lucide-react"
import { ActionButton } from "@/components/shared/action-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Stepper, type Step } from "@/components/shared/stepper"
import { StudentManager, type DraftStudent } from "@/components/teacher/student-manager"
import { createGroup } from "@/lib/features/teacher/data"
import { RoleGuard } from "@/components/shared/role-guard"

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
  const [error, setError] = useState<string | null>(null)
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
      setError("El nombre del curso es requerido.")
      return
    }
    setError(null)
    setPaso((p) => Math.min(p + 1, PASOS.length - 1))
  }

  const retroceder = () => {
    setError(null)
    setPaso((p) => Math.max(p - 1, 0))
  }

  const handlePublish = async () => {
    setError(null)
    setPublishing(true)
    try {
      const response = await createGroup({
        name: groupName,
        description,
        students: students.map((s) => ({ name: s.name, email: s.email, code: s.code })),
      })
      const e = response.enrollment
      const parts: string[] = []
      if (e.registered) parts.push(`${e.registered} inscrito(s)`)
      if (e.skipped) parts.push(`${e.skipped} ya inscrito(s)`)
      if (e.errors.length) parts.push(`${e.errors.length} con error`)
      const summary = parts.length ? parts.join(", ") : "sin estudiantes"
      router.push(`/groups/${response.group.id}?created=1&summary=${encodeURIComponent(summary)}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo publicar el curso.")
      setPublishing(false)
    }
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

          {error && (
            <p className="mt-6 rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

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
