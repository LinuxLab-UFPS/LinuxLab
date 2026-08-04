"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send, ArrowLeft } from "lucide-react"
import { ActionButton } from "@/components/shared/action-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StudentManager, type DraftStudent } from "@/components/teacher/student-manager"
import { createGroup } from "@/lib/features/teacher/data"
import { RoleGuard } from "@/components/shared/role-guard"

/** Sin marco ni relleno: cada bloque se lee directo sobre el lienzo. */
/** Sin marco: solo el sangrado que tenian los paneles, para que nada se mueva. */
const PANEL = "p-6"

function CreateGroupContent() {
  const router = useRouter()
  const [groupName, setGroupName] = useState("")
  const [description, setDescription] = useState("")
  const [students, setStudents] = useState<DraftStudent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
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

  const handlePublish = async () => {
    setError(null)
    setInfo(null)
    if (!groupName.trim()) {
      setError("El nombre del curso es requerido.")
      return
    }
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
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <ActionButton tone="neutral" href="/home">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </ActionButton>

      {error && (
        <div className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}
      {info && !error && (
        <div className="rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
          {info}
        </div>
      )}

      <section className={PANEL}>
        <h2 className="mb-6 text-lg font-medium text-foreground">Información del curso</h2>

        <div className="space-y-4">
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
      </section>

      <section className={PANEL}>
        <h2 className="mb-6 flex items-center text-lg font-medium text-foreground">
          Estudiantes
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {students.length} estudiantes agregados
          </span>
        </h2>

        <StudentManager
          students={students}
          onAdd={addStudent}
          onAddMany={addStudents}
          onRemove={removeStudent}
        />
      </section>

      <div className="flex justify-end">
        <ActionButton tone="primary" onClick={handlePublish} disabled={publishing}>
          <Send className="h-4 w-4" />
          {publishing ? "Creando curso..." : "Crear curso"}
        </ActionButton>
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
